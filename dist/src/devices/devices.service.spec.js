"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const devices_service_1 = require("./devices.service");
const devices_query_dto_1 = require("./dto/devices-query.dto");
describe('DevicesService', () => {
    let service;
    let mockDb;
    let mockRealtime;
    beforeEach(() => {
        mockDb = {
            select: jest.fn(),
            selectDistinctOn: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
        };
        mockRealtime = {
            emitDevices: jest.fn(),
            emitDevicesListUpdated: jest.fn(),
            emitAlertCreated: jest.fn(),
            emitDeviceStatusChanged: jest.fn(),
        };
        const mockPush = { sendDeviceAlertNotification: jest.fn() };
        service = new devices_service_1.DevicesService(mockDb, mockRealtime, mockPush);
    });
    it('does not persist or broadcast mock router devices', async () => {
        await service.ingestDiscoveredDevices([
            {
                macAddress: '3C:22:FB:45:67:89',
                ipAddress: '192.168.1.10',
                hostname: 'Mock Device',
                deviceType: 'laptop',
                connectionType: 'wifi',
                isOnline: true,
                source: 'mock_dhcp',
            },
        ]);
        expect(mockDb.select).not.toHaveBeenCalled();
        expect(mockDb.insert).not.toHaveBeenCalled();
        expect(mockDb.update).not.toHaveBeenCalled();
    });
    it('lists one inventory record per device identity', async () => {
        const device = {
            id: 'device-1',
            macAddress: '02:11:22:33:44:55',
            hostname: 'iPad',
            ipAddress: '192.168.1.20',
            deviceType: 'tablet',
            connectionType: 'wifi',
            firstSeenAt: new Date('2026-10-25T12:00:00.000Z'),
            lastSeenAt: new Date('2026-10-26T12:00:00.000Z'),
            isOnline: true,
            source: 'airtel_arp',
        };
        const countQuery = {
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockResolvedValue([{ count: 1 }]),
        };
        const devicesQuery = {
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue([device]),
        };
        mockDb.select.mockReturnValue(countQuery);
        mockDb.selectDistinctOn.mockReturnValue(devicesQuery);
        const query = new devices_query_dto_1.DevicesQueryDto();
        query.limit = 20;
        const result = await service.listDevices(query);
        expect(mockDb.selectDistinctOn).toHaveBeenCalledTimes(1);
        expect(result.meta.totalItems).toBe(1);
        expect(result.items).toHaveLength(1);
        expect(result.items[0].name).toBe('iPad');
    });
    it('keeps a recently seen device online when one discovery poll misses it', async () => {
        const device = {
            id: 'device-1',
            macAddress: '02:11:22:33:44:55',
            hostname: 'iPad',
            ipAddress: '192.168.1.20',
            deviceType: 'tablet',
            connectionType: 'unknown',
            firstSeenAt: new Date('2026-10-25T12:00:00.000Z'),
            lastSeenAt: new Date(),
            isOnline: true,
            source: 'airtel_arp',
        };
        const selectQuery = {
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockResolvedValue([device]),
        };
        mockDb.select.mockReturnValue(selectQuery);
        await service.ingestDiscoveredDevices([]);
        expect(mockDb.update).not.toHaveBeenCalled();
        expect(mockRealtime.emitDevices).toHaveBeenCalledWith(expect.objectContaining({
            totalConnected: 1,
            devices: [expect.objectContaining({ ipAddress: device.ipAddress, isOnline: true })],
        }));
    });
    it('does not create activity history entries for unchanged poll results', async () => {
        const device = {
            id: 'device-1',
            macAddress: '02:11:22:33:44:55',
            hostname: 'iPad',
            ipAddress: '192.168.1.20',
            deviceType: 'tablet',
            connectionType: 'wifi',
            firstSeenAt: new Date('2026-10-25T12:00:00.000Z'),
            lastSeenAt: new Date(),
            isOnline: true,
            source: 'airtel_arp',
        };
        const queryFor = (rows) => {
            const query = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                then: (resolve, reject) => Promise.resolve(rows).then(resolve, reject),
            };
            return query;
        };
        mockDb.select
            .mockReturnValueOnce(queryFor([device]))
            .mockReturnValueOnce(queryFor([device]));
        mockDb.update.mockReturnValue({
            set: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue([]),
            }),
        });
        mockDb.insert.mockReturnValue({
            values: jest.fn().mockResolvedValue([]),
        });
        await service.ingestDiscoveredDevices([
            {
                macAddress: device.macAddress,
                ipAddress: device.ipAddress,
                hostname: device.hostname,
                deviceType: device.deviceType,
                connectionType: 'wifi',
                isOnline: true,
                source: 'airtel_arp',
            },
        ]);
        expect(mockDb.insert).not.toHaveBeenCalled();
    });
    it('records activity when a previously online device is absent past the grace period', async () => {
        const device = {
            id: 'device-1',
            macAddress: '02:11:22:33:44:55',
            hostname: 'iPad',
            ipAddress: '192.168.1.20',
            deviceType: 'tablet',
            connectionType: 'wifi',
            firstSeenAt: new Date('2026-10-25T12:00:00.000Z'),
            lastSeenAt: new Date(Date.now() - 60_000),
            isOnline: true,
            source: 'airtel_arp',
        };
        const query = {
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            then: (resolve, reject) => Promise.resolve([device]).then(resolve, reject),
        };
        const values = jest.fn().mockResolvedValue([]);
        mockDb.select.mockReturnValue(query);
        mockDb.update.mockReturnValue({
            set: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue([]),
            }),
        });
        mockDb.insert.mockReturnValue({ values });
        await service.ingestDiscoveredDevices([]);
        expect(mockDb.update).toHaveBeenCalled();
        expect(values).toHaveBeenCalledWith(expect.objectContaining({
            deviceId: device.id,
            isOnline: false,
            source: 'router_absence',
        }));
        expect(mockRealtime.emitDeviceStatusChanged).toHaveBeenCalledWith(expect.objectContaining({ event: 'disconnected', ipAddress: device.ipAddress }));
    });
    describe('normalizeMac', () => {
        it('should correctly normalize lowercase unseparated MAC address', () => {
            expect(service.normalizeMac('3c22fb456789')).toBe('3C:22:FB:45:67:89');
        });
        it('should normalize dash-separated MAC address to colons', () => {
            expect(service.normalizeMac('3C-22-FB-45-67-89')).toBe('3C:22:FB:45:67:89');
        });
        it('should preserve standard colon-separated MAC address in uppercase', () => {
            expect(service.normalizeMac('3c:22:fb:45:67:89')).toBe('3C:22:FB:45:67:89');
        });
        it('should return null when MAC is null or empty', () => {
            expect(service.normalizeMac(null)).toBeNull();
            expect(service.normalizeMac(undefined)).toBeNull();
            expect(service.normalizeMac('')).toBeNull();
        });
    });
});
//# sourceMappingURL=devices.service.spec.js.map