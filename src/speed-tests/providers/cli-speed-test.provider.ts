import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  SpeedTestProvider,
  SpeedTestResult,
} from './speed-test-provider.interface';
import { SimulationSpeedTestProvider } from './simulation-speed-test.provider';

const execFileAsync = promisify(execFile);

@Injectable()
export class CliSpeedTestProvider implements SpeedTestProvider {
  readonly name = 'cli';
  private readonly logger = new Logger(CliSpeedTestProvider.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly simulationProvider: SimulationSpeedTestProvider,
  ) {}

  async execute(): Promise<SpeedTestResult> {
    const bin = this.configService.get<string>('app.speedtestBin') || 'speedtest';
    const now = new Date();

    try {
      this.logger.log(`Executing Ookla Speedtest binary: '${bin}'`);
      const { stdout } = await execFileAsync(
        bin,
        ['--format=json', '--accept-license', '--accept-gdpr'],
        {
          timeout: 60000,
          maxBuffer: 1024 * 1024,
        },
      );

      const parsed = JSON.parse(stdout);

      // Ookla JSON format:
      // download.bandwidth is bytes/second -> convert to Mbps (* 8 / 1,000,000)
      const downloadMbps = parsed.download?.bandwidth
        ? (parsed.download.bandwidth * 8) / 1000000
        : null;
      const uploadMbps = parsed.upload?.bandwidth
        ? (parsed.upload.bandwidth * 8) / 1000000
        : null;
      const latencyMs = parsed.ping?.latency ?? null;
      const jitterMs = parsed.ping?.jitter ?? null;
      const serverName = parsed.server?.name ?? 'Unknown Server';

      return {
        status: 'success',
        downloadMbps: downloadMbps ? parseFloat(downloadMbps.toFixed(2)) : null,
        uploadMbps: uploadMbps ? parseFloat(uploadMbps.toFixed(2)) : null,
        latencyMs: latencyMs ? parseFloat(latencyMs.toFixed(2)) : null,
        jitterMs: jitterMs ? parseFloat(jitterMs.toFixed(2)) : null,
        serverName,
        provider: 'ookla_cli',
        measuredAt: now,
      };
    } catch (err: any) {
      // If binary is missing, gracefully use simulation fallback in dev/test mode
      if (err.code === 'ENOENT') {
        this.logger.warn(
          `Speedtest binary '${bin}' not found in PATH. Using simulation fallback for telemetry.`,
        );
        return this.simulationProvider.execute();
      }

      this.logger.error(`Speedtest CLI execution failed: ${err.message}`);

      // Sanitize error message to prevent any leakage
      const sanitizedError = (err.stderr || err.message || 'CLI execution error')
        .replace(/[\r\n]+/g, ' ')
        .substring(0, 300);

      return {
        status: 'failed',
        downloadMbps: null,
        uploadMbps: null,
        latencyMs: null,
        jitterMs: null,
        serverName: null,
        provider: 'ookla_cli',
        errorCode: err.code || 'EXEC_FAIL',
        errorMessage: sanitizedError,
        measuredAt: now,
      };
    }
  }
}
