import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SpeedTestsService } from './speed-tests.service';

@Injectable()
export class SpeedTestScheduler {
  private readonly logger = new Logger(SpeedTestScheduler.name);

  constructor(private readonly speedTestsService: SpeedTestsService) {}

  /**
   * Periodic speed test run every 15 minutes (or default interval)
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleScheduledSpeedTest() {
    this.logger.log('Triggering scheduled internet speed test...');
    try {
      await this.speedTestsService.runTest();
      this.logger.log('Scheduled internet speed test completed successfully.');
    } catch (err: any) {
      this.logger.warn(`Scheduled speed test did not complete: ${err.message}`);
    }
  }
}
