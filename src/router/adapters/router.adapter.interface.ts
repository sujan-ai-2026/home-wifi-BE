export interface RouterStatusResult {
  wanConnected: boolean | null;
  routerUptimeSeconds: number | null;
  status: 'ok' | 'degraded' | 'unreachable' | 'unsupported' | 'not_configured';
  modelInfo?: string;
  source: string;
}

export interface RouterDevice {
  macAddress: string | null;
  ipAddress: string | null;
  hostname: string | null;
  deviceType: string;
  connectionType: 'wifi' | 'ethernet' | 'unknown';
  isOnline: boolean;
  source: string;
}

export interface InterfaceCountersResult {
  receivedBytes: number | null;
  transmittedBytes: number | null;
  source: string;
}

export interface RouterAdapter {
  readonly name: string;
  getStatus(): Promise<RouterStatusResult>;
  getConnectedDevices(): Promise<RouterDevice[]>;
  getInterfaceCounters(): Promise<InterfaceCountersResult | null>;
}
