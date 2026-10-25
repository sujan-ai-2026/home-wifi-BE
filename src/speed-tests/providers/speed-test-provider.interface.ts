export interface SpeedTestResult {
  status: 'success' | 'failed';
  downloadMbps: number | null;
  uploadMbps: number | null;
  latencyMs: number | null;
  jitterMs: number | null;
  serverName: string | null;
  provider: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  measuredAt: Date;
}

export interface SpeedTestProvider {
  readonly name: string;
  execute(): Promise<SpeedTestResult>;
}
