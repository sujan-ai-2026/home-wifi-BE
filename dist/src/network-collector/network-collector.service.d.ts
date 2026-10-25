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
export declare class NetworkCollectorService {
    private readonly routerService;
    private readonly speedTestsService;
    private readonly realtimeService;
    private readonly logger;
    private readonly externalProbeTargets;
    constructor(routerService: RouterService, speedTestsService: SpeedTestsService, realtimeService: RealtimeService);
    probeTcpEndpoint(host: string, port: number, timeoutMs?: number): Promise<boolean>;
    checkExternalInternetReachable(): Promise<boolean>;
    getHealthState(): Promise<InternetHealthState>;
}
