import { RealtimeGateway } from './realtime.gateway';
import { RouterDevice } from '../router/adapters/router.adapter.interface';
export interface SpeedTestUpdatedPayload {
    id: string;
    downloadMbps: number | null;
    uploadMbps: number | null;
    latencyMs: number | null;
    jitterMs: number | null;
    status: string;
    measuredAt: string;
}
export interface InternetHealthUpdatedPayload {
    internetHealth: 'healthy' | 'degraded' | 'offline';
    routerReachable: boolean;
    wanConnected: boolean;
    externalReachable: boolean;
    measurementStale: boolean;
    checkedAt: string;
}
export interface DevicesUpdatedPayload {
    totalConnected: number;
    updatedAt: string;
    devices?: RouterDevice[];
}
export interface AlertEventPayload {
    id: string;
    incidentKey: string;
    metric: string;
    measuredValue: number;
    thresholdValue: number;
    severity: string;
    status: string;
    startedAt: string;
    resolvedAt?: string | null;
    title?: string;
    detail?: string;
}
export interface DeviceAlertPayload {
    event: 'connected' | 'disconnected';
    deviceName: string;
    ipAddress?: string | null;
    macAddress?: string | null;
    title: string;
    detail: string;
    timestamp: string;
}
export declare class RealtimeService {
    private readonly gateway;
    private readonly logger;
    constructor(gateway: RealtimeGateway);
    emitSpeedTest(payload: SpeedTestUpdatedPayload): void;
    emitInternetHealth(payload: InternetHealthUpdatedPayload): void;
    emitDevices(payload: DevicesUpdatedPayload): void;
    emitDevicesListUpdated(devices?: RouterDevice[]): void;
    emitAlertCreated(payload: AlertEventPayload): void;
    emitAlertResolved(payload: AlertEventPayload): void;
    emitDeviceStatusChanged(payload: DeviceAlertPayload): void;
}
