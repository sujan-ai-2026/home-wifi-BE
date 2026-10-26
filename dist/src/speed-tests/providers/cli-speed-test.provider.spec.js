"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_speed_test_provider_1 = require("./cli-speed-test.provider");
describe('CliSpeedTestProvider', () => {
    it('returns a failed result instead of simulated data when speedtest is unavailable', async () => {
        const configService = {
            get: jest.fn().mockReturnValue('/missing/speedtest'),
        };
        const provider = new cli_speed_test_provider_1.CliSpeedTestProvider(configService);
        const result = await provider.execute();
        expect(result).toMatchObject({
            status: 'failed',
            downloadMbps: null,
            uploadMbps: null,
            provider: 'ookla_cli',
            errorCode: 'SPEEDTEST_NOT_INSTALLED',
        });
    });
});
//# sourceMappingURL=cli-speed-test.provider.spec.js.map