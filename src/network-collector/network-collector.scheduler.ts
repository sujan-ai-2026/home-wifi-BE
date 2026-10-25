import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NetworkCollectorService } from './network-collector.service';
import { RouterService } from '../router/router.service';
import { DevicesService } from '../devices/devices.service';
import { RealtimeService } from '../realtime/realtime.service';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class NetworkCollectorScheduler {
  private readonly logger = new Logger(NetworkCollectorScheduler.name);
  private isCollecting = false;

  constructor(
    private readonly collectorService: NetworkCollectorService,
    private readonly routerService: RouterService,
    private readonly devicesService: DevicesService,
    private readonly realtimeService: RealtimeService,
    private readonly alertsService: AlertsService,
  ) {}

  // Purge alerts older than 2 days every midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleAlertPurge() {
    try {
      await this.alertsService.purgeOldAlerts();
    } catch (err: any) {
      this.logger.error(`Alert purge error: ${err.message}`);
    }
  }

  // Fast 10-second polling for real-time device connection/disconnection detection
  @Cron('*/10 * * * * *')
  async handlePeriodicCollection() {
    if (this.isCollecting) return;
    this.isCollecting = true;

    try {
      // 1. Fetch connected devices from active router adapter and ingest
      const discovered = await this.routerService.getConnectedDevices();
      if (discovered && discovered.length > 0) {
        await this.devicesService.ingestDiscoveredDevices(discovered);
      }

      // 2. Probe health state and emit real-time event
      const health = await this.collectorService.getHealthState();
      this.realtimeService.emitInternetHealth({
        internetHealth: health.internetHealth,
        routerReachable: health.routerReachable,
        wanConnected: health.wanConnected,
        externalReachable: health.externalReachable,
        measurementStale: health.measurementStale,
        checkedAt: health.checkedAt,
      });
    } catch (err: any) {
      this.logger.error(`Periodic network telemetry collection error: ${err.message}`);
    } finally {
      this.isCollecting = false;
    }
  }
}
