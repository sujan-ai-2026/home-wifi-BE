import { SpeedTestsService } from '../speed-tests/speed-tests.service';
import { NetworkCollectorService } from '../network-collector/network-collector.service';
import { DevicesService } from '../devices/devices.service';
import { AlertsService } from '../alerts/alerts.service';
import { RouterService } from '../router/router.service';
export declare class DashboardService {
    private readonly speedTestsService;
    private readonly collectorService;
    private readonly devicesService;
    private readonly alertsService;
    private readonly routerService;
    private readonly logger;
    constructor(speedTestsService: SpeedTestsService, collectorService: NetworkCollectorService, devicesService: DevicesService, alertsService: AlertsService, routerService: RouterService);
    getOverview(): Promise<{
        internetHealthState: "offline" | "healthy" | "degraded";
        routerReachable: boolean;
        wanConnected: boolean;
        routerStatus: string;
        measurementFreshness: {
            isStale: boolean;
            freshnessSeconds: number | null;
        };
        latestSuccessful: {
            id: string;
            downloadMbps: number | null;
            uploadMbps: number | null;
            latencyMs: number | null;
            jitterMs: number | null;
            serverName: string | null;
            provider: string;
            measuredAt: string;
        } | null;
        latestAttempt: {
            id: string;
            status: string;
            errorCode: string | null;
            errorMessage: string | null;
            measuredAt: string;
        } | null;
        activeLowSpeedIncidents: number;
        connectedDeviceCount: number;
        lastRouterObservation: {
            observedAt: string;
            status: string;
            wanConnected: boolean | null;
            routerUptimeSeconds: number | null;
            receivedBytes: number | null;
            transmittedBytes: number | null;
        } | null;
        generatedAt: string;
        status: "offline" | "healthy" | "degraded";
        downloadMbps: number | null;
        uploadMbps: number | null;
        latencyMs: number | null;
        jitterMs: number | null;
        connectedDevices: number;
        lastUpdated: string;
        speedHistory: {
            timestamp: string;
            downloadMbps: number | null;
            uploadMbps: number | null;
        }[];
    }>;
}
