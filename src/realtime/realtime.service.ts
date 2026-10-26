import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly gateway: RealtimeGateway) {}

  emitSpeedTest(payload: SpeedTestUpdatedPayload) {
    this.logger.debug(`Emitting speed-test.updated: ${payload.id}`);
    this.gateway.broadcast('speed-test.updated', payload);
  }

  emitInternetHealth(payload: InternetHealthUpdatedPayload) {
    this.logger.debug(`Emitting internet-health.updated: ${payload.internetHealth}`);
    this.gateway.broadcast('internet-health.updated', payload);
  }

  emitDevices(payload: DevicesUpdatedPayload) {
    this.logger.debug(`Emitting devices.updated: ${payload.totalConnected} devices`);
    this.gateway.broadcast('devices.updated', payload);
  }

  emitDevicesListUpdated(devices?: RouterDevice[]) {
    this.logger.debug(`Emitting devices.list.updated`);
    this.gateway.broadcast('devices.list.updated', {
      updatedAt: new Date().toISOString(),
      ...(devices ? { devices } : {}),
    });
  }

  emitAlertCreated(payload: AlertEventPayload) {
    this.logger.log(`Emitting alert.created for ${payload.metric}: ${payload.title || payload.metric}`);
    this.gateway.broadcast('alert.created', payload);
  }

  emitAlertResolved(payload: AlertEventPayload) {
    this.logger.log(`Emitting alert.resolved for ${payload.metric}: ${payload.id}`);
    this.gateway.broadcast('alert.resolved', payload);
  }

  emitDeviceStatusChanged(payload: DeviceAlertPayload) {
    this.logger.log(`Emitting device.${payload.event}: ${payload.deviceName} (${payload.ipAddress})`);
    this.gateway.broadcast(`device.${payload.event}`, payload);
  }
}
