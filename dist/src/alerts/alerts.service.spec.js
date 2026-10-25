"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const alerts_service_1 = require("./alerts.service");
describe('AlertsService Low-Speed Incident State Machine', () => {
    let service;
    let mockDb;
    let mockSettingsService;
    let mockPushService;
    let mockRealtimeService;
    beforeEach(() => {
        mockDb = {
            select: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
        };
        mockSettingsService = {
            getSettings: jest.fn().mockResolvedValue({
                downloadThresholdMbps: 10,
                uploadThresholdMbps: 10,
                consecutiveBreachesRequired: 2,
                recoveryThresholdMbps: 12,
                recoverySamplesRequired: 1,
            }),
        };
        mockPushService = {
            sendAlertNotifications: jest.fn().mockResolvedValue(undefined),
        };
        mockRealtimeService = {
            emitAlertCreated: jest.fn(),
            emitAlertResolved: jest.fn(),
        };
        service = new alerts_service_1.AlertsService(mockDb, mockSettingsService, mockPushService, mockRealtimeService);
    });
    it('should not create an incident on the first low measurement when 2 breaches are required', async () => {
        mockDb.select.mockReturnValue({
            from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([]),
                }),
            }),
        });
        await service.evaluateMeasurement(5.0, 15.0, new Date());
        expect(mockDb.insert).not.toHaveBeenCalled();
        expect(mockRealtimeService.emitAlertCreated).not.toHaveBeenCalled();
    });
    it('should create an active incident on the second consecutive low measurement', async () => {
        mockDb.select.mockReturnValue({
            from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([]),
                }),
            }),
        });
        const insertedAlert = {
            id: 'alert-123',
            incidentKey: 'low_speed_download_active',
            metric: 'download',
            measuredValue: '5.00',
            thresholdValue: '10.00',
            severity: 'warning',
            status: 'active',
            startedAt: new Date(),
        };
        mockDb.insert.mockReturnValue({
            values: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([insertedAlert]),
            }),
        });
        await service.evaluateMeasurement(5.0, 15.0, new Date());
        await service.evaluateMeasurement(4.5, 15.0, new Date());
        expect(mockDb.insert).toHaveBeenCalledTimes(1);
        expect(mockRealtimeService.emitAlertCreated).toHaveBeenCalledWith(expect.objectContaining({
            metric: 'download',
            status: 'active',
        }));
        expect(mockPushService.sendAlertNotifications).toHaveBeenCalledTimes(1);
    });
    it('should resolve active incident when speed recovers above recovery threshold', async () => {
        const activeIncident = {
            id: 'alert-123',
            incidentKey: 'low_speed_download_active',
            metric: 'download',
            status: 'active',
        };
        mockDb.select.mockReturnValue({
            from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([activeIncident]),
                }),
            }),
        });
        const resolvedAlert = {
            id: 'alert-123',
            incidentKey: 'low_speed_download_resolved_alert-123',
            metric: 'download',
            measuredValue: '15.00',
            thresholdValue: '10.00',
            severity: 'warning',
            status: 'resolved',
            startedAt: new Date(),
            resolvedAt: new Date(),
        };
        mockDb.update.mockReturnValue({
            set: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([resolvedAlert]),
                }),
            }),
        });
        await service.evaluateMeasurement(15.0, 15.0, new Date());
        expect(mockDb.update).toHaveBeenCalled();
        expect(mockRealtimeService.emitAlertResolved).toHaveBeenCalledWith(expect.objectContaining({
            metric: 'download',
            status: 'resolved',
        }));
    });
});
//# sourceMappingURL=alerts.service.spec.js.map