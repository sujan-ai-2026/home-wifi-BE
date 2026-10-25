"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const devices_service_1 = require("./devices.service");
describe('DevicesService', () => {
    let service;
    beforeEach(() => {
        const mockDb = {};
        const mockRealtime = { emitDevices: jest.fn(), emitAlertCreated: jest.fn() };
        const mockPush = { sendDeviceAlertNotification: jest.fn() };
        service = new devices_service_1.DevicesService(mockDb, mockRealtime, mockPush);
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