"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reports_service_1 = require("./reports.service");
describe('ReportsService', () => {
    let service;
    let mockDb;
    let mockSettingsService;
    beforeEach(() => {
        mockDb = {
            select: jest.fn(),
        };
        mockSettingsService = {
            getSettings: jest.fn().mockResolvedValue({
                timezone: 'Asia/Kolkata',
                routerPollIntervalSeconds: 60,
            }),
        };
        service = new reports_service_1.ReportsService(mockDb, mockSettingsService);
    });
    it('should escape CSV cells to prevent formula injection', async () => {
        mockDb.select.mockReturnValue({
            from: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue([
                    {
                        measuredAt: new Date('2026-10-01T12:00:00Z'),
                        status: 'success',
                        downloadMbps: '100.50',
                        uploadMbps: '50.25',
                        latencyMs: '12.00',
                        jitterMs: '1.50',
                        serverName: '=cmd|/C calc!A0',
                        provider: '+malicious_provider',
                        errorCode: null,
                    },
                ]),
            }),
        });
        const csv = await service.exportMonthlyCsv('2026-10');
        expect(csv).toContain("'=cmd|/C calc!A0");
        expect(csv).toContain("'+malicious_provider");
    });
    it('should throw on invalid month format', async () => {
        await expect(service.getMonthlyReport('2026-13')).rejects.toThrow(/Invalid month format/);
    });
});
//# sourceMappingURL=reports.service.spec.js.map