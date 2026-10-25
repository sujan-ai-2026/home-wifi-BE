import { Injectable, Logger } from '@nestjs/common';
import {
  SpeedTestProvider,
  SpeedTestResult,
} from './speed-test-provider.interface';

@Injectable()
export class SimulationSpeedTestProvider implements SpeedTestProvider {
  readonly name = 'simulation';
  private readonly logger = new Logger(SimulationSpeedTestProvider.name);

  async execute(): Promise<SpeedTestResult> {
    this.logger.log('Executing simulated speed test...');
    // Introduce a short measurement duration
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Realistic fiber broadband numbers (e.g. 95 - 110 Mbps download, 90 - 105 Mbps upload)
    const download = 95 + Math.random() * 15;
    const upload = 90 + Math.random() * 15;
    const latency = 10 + Math.random() * 4;
    const jitter = 1 + Math.random() * 2;

    return {
      status: 'success',
      downloadMbps: parseFloat(download.toFixed(2)),
      uploadMbps: parseFloat(upload.toFixed(2)),
      latencyMs: parseFloat(latency.toFixed(2)),
      jitterMs: parseFloat(jitter.toFixed(2)),
      serverName: 'Airtel Broadband - Local PoP (Simulated)',
      provider: 'simulation',
      measuredAt: new Date(),
    };
  }
}
