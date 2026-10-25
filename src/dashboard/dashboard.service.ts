import { Injectable, Logger } from '@nestjs/common';
import { SpeedTestsService } from '../speed-tests/speed-tests.service';
import { NetworkCollectorService } from '../network-collector/network-collector.service';
import { DevicesService } from '../devices/devices.service';
import { AlertsService } from '../alerts/alerts.service';
import { RouterService } from '../router/router.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly speedTestsService: SpeedTestsService,
    private readonly collectorService: NetworkCollectorService,
    private readonly devicesService: DevicesService,
    private readonly alertsService: AlertsService,
    private readonly routerService: RouterService,
  ) {}

  async getOverview() {
    const [speedTelemetry, healthState, onlineDevices, activeAlerts, latestSnapshot, history] =
      await Promise.all([
        this.speedTestsService.getLatest(),
        this.collectorService.getHealthState(),
        this.devicesService.getOnlineDeviceCount(),
        this.alertsService.getActiveIncidentCount(),
        this.routerService.getLatestSnapshot(),
        this.speedTestsService.getHistory({
          page: 1,
          limit: 10,
          status: 'success',
          offset: 0,
        }),
      ]);

    const wanConnected = latestSnapshot?.wanConnected ?? healthState.wanConnected;
    const routerStatus = latestSnapshot?.status ?? 'unverified';

    const speedHistory = (history?.items || [])
      .slice()
      .reverse()
      .map((t) => {
        const d = new Date(t.measuredAt);
        const timeStr = isNaN(d.getTime())
          ? t.measuredAt
          : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        return {
          timestamp: timeStr,
          downloadMbps: t.downloadMbps,
          uploadMbps: t.uploadMbps,
        };
      });

    const nowIso = new Date().toISOString();

    return {
      internetHealthState: healthState.internetHealth,
      routerReachable: healthState.routerReachable,
      wanConnected,
      routerStatus,
      measurementFreshness: {
        isStale: speedTelemetry.isStale,
        freshnessSeconds: speedTelemetry.freshnessSeconds,
      },
      latestSuccessful: speedTelemetry.latestSuccessful,
      latestAttempt: speedTelemetry.latestAttempt,
      activeLowSpeedIncidents: activeAlerts,
      connectedDeviceCount: onlineDevices,
      lastRouterObservation: latestSnapshot
        ? {
            observedAt: latestSnapshot.observedAt.toISOString(),
            status: latestSnapshot.status,
            wanConnected: latestSnapshot.wanConnected,
            routerUptimeSeconds: latestSnapshot.routerUptimeSeconds,
            receivedBytes: latestSnapshot.receivedBytes,
            transmittedBytes: latestSnapshot.transmittedBytes,
          }
        : null,
      generatedAt: nowIso,

      // Frontend NetworkOverview compatibility
      status: healthState.internetHealth,
      downloadMbps: speedTelemetry.latestSuccessful?.downloadMbps ?? null,
      uploadMbps: speedTelemetry.latestSuccessful?.uploadMbps ?? null,
      latencyMs: speedTelemetry.latestSuccessful?.latencyMs ?? null,
      jitterMs: speedTelemetry.latestSuccessful?.jitterMs ?? null,
      connectedDevices: onlineDevices,
      lastUpdated: speedTelemetry.latestSuccessful?.measuredAt ?? nowIso,
      speedHistory,
    };
  }
}
