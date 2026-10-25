import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getOverview(): Promise<{
        internetHealthState: "healthy" | "degraded" | "offline";
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
        status: "healthy" | "degraded" | "offline";
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
