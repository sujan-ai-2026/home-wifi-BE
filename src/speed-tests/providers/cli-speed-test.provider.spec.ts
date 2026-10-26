import { ConfigService } from '@nestjs/config';
import { CliSpeedTestProvider } from './cli-speed-test.provider';

describe('CliSpeedTestProvider', () => {
  it('returns a failed result instead of simulated data when speedtest is unavailable', async () => {
    const configService = {
      get: jest.fn().mockReturnValue('/missing/speedtest'),
    } as unknown as ConfigService;
    const provider = new CliSpeedTestProvider(configService);

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
