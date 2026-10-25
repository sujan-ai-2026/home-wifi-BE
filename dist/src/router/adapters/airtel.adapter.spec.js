"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const airtel_adapter_1 = require("./airtel.adapter");
describe('AirtelRouterAdapter', () => {
    let adapter;
    let mockConfigService;
    beforeEach(() => {
        mockConfigService = {
            get: jest.fn(),
        };
        adapter = new airtel_adapter_1.AirtelRouterAdapter(mockConfigService);
    });
    it('should report not_configured when URL is an AWS metadata service SSRF attempt', async () => {
        mockConfigService.get.mockReturnValue('http://169.254.169.254/latest/meta-data/');
        const status = await adapter.getStatus();
        expect(status.status).toBe('not_configured');
        expect(status.wanConnected).toBeNull();
    });
    it('should report not_configured when URL is an arbitrary public internet domain', async () => {
        mockConfigService.get.mockReturnValue('http://evil.com/exploit');
        const status = await adapter.getStatus();
        expect(status.status).toBe('not_configured');
        expect(status.wanConnected).toBeNull();
    });
    it('should return discovered gateway device and active devices', async () => {
        const devices = await adapter.getConnectedDevices();
        const counters = await adapter.getInterfaceCounters();
        expect(devices.length).toBeGreaterThanOrEqual(1);
        expect(devices[0].macAddress).toBe('44:63:C2:3B:7A:C0');
        expect(counters).toHaveProperty('receivedBytes');
    });
});
//# sourceMappingURL=airtel.adapter.spec.js.map