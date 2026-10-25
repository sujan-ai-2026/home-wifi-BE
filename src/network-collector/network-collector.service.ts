import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';
import { RouterService } from '../router/router.service';
import { SpeedTestsService } from '../speed-tests/speed-tests.service';
import { RealtimeService } from '../realtime/realtime.service';

export interface InternetHealthState {
  internetHealth: 'healthy' | 'degraded' | 'offline';
  routerReachable: boolean;
  wanConnected: boolean;
  externalReachable: boolean;
  measurementStale: boolean;
  latestSpeedMbps: number | null;
  latencyMs: number | null;
  jitterMs: number | null;
  checkedAt: string;
}

@Injectable()
export class NetworkCollectorService {
  private readonly logger = new Logger(NetworkCollectorService.name);

  // Trusted DNS endpoints to verify external reachability
  private readonly externalProbeTargets = [
    { host: '1.1.1.1', port: 53 },
    { host: '8.8.8.8', port: 53 },
  ];

  constructor(
    private readonly routerService: RouterService,
    private readonly speedTestsService: SpeedTestsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  /**
   * Safe TCP socket probe with timeout
   */
  async probeTcpEndpoint(host: string, port: number, timeoutMs = 2000): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let resolved = false;

      socket.setTimeout(timeoutMs);

      socket.on('connect', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(true);
        }
      });

      socket.on('timeout', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      });

      socket.on('error', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      });

      socket.connect(port, host);
    });
  }

  /**
   * Checks multiple trusted targets so a single failing host doesn't declare the ISP connection down
   */
  async checkExternalInternetReachable(): Promise<boolean> {
    const results = await Promise.all(
      this.externalProbeTargets.map((target) =>
        this.probeTcpEndpoint(target.host, target.port, 2000),
      ),
    );

    // If at least one trusted external probe responds, internet is reachable
    return results.some((r) => r === true);
  }

  async getHealthState(): Promise<InternetHealthState> {
    const snapshot = await this.routerService.pollAndPersistSnapshot();
    const externalReachable = await this.checkExternalInternetReachable();
    const speedTelemetry = await this.speedTestsService.getLatest();

    const routerReachable = snapshot.status !== 'unreachable';
    const wanConnected = snapshot.wanConnected ?? externalReachable;
    const measurementStale = speedTelemetry.isStale;

    let internetHealth: 'healthy' | 'degraded' | 'offline' = 'healthy';

    if (!externalReachable && !wanConnected) {
      internetHealth = 'offline';
    } else if (!routerReachable || measurementStale || !externalReachable) {
      internetHealth = 'degraded';
    }

    const state: InternetHealthState = {
      internetHealth,
      routerReachable,
      wanConnected,
      externalReachable,
      measurementStale,
      latestSpeedMbps: speedTelemetry.latestSuccessful?.downloadMbps ?? null,
      latencyMs: speedTelemetry.latestSuccessful?.latencyMs ?? null,
      jitterMs: speedTelemetry.latestSuccessful?.jitterMs ?? null,
      checkedAt: new Date().toISOString(),
    };

    return state;
  }
}
