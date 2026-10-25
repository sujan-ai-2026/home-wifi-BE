import { DrizzleDb } from '../database/database.provider';
import { CliSpeedTestProvider } from './providers/cli-speed-test.provider';
import { SpeedTestResult } from './providers/speed-test-provider.interface';
import { AlertsService } from '../alerts/alerts.service';
import { RealtimeService } from '../realtime/realtime.service';
import { SettingsService } from '../settings/settings.service';
import { SpeedTestHistoryQueryDto } from './dto/speed-test-history-query.dto';
export declare class SpeedTestsService {
    private readonly db;
    private readonly cliProvider;
    private readonly alertsService;
    private readonly realtimeService;
    private readonly settingsService;
    private readonly logger;
    private isRunning;
    constructor(db: DrizzleDb, cliProvider: CliSpeedTestProvider, alertsService: AlertsService, realtimeService: RealtimeService, settingsService: SettingsService);
    runTest(): Promise<SpeedTestResult>;
    getLatest(): Promise<{
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
        isStale: boolean;
        freshnessSeconds: number | null;
    }>;
    getHistory(query: SpeedTestHistoryQueryDto): Promise<{
        items: {
            id: string;
            downloadMbps: number | null;
            uploadMbps: number | null;
            latencyMs: number | null;
            jitterMs: number | null;
            serverName: string | null;
            provider: string;
            status: string;
            errorCode: string | null;
            errorMessage: string | null;
            measuredAt: string;
            createdAt: string;
        }[];
        meta: {
            page: number;
            limit: number;
            totalItems: number;
            totalPages: number;
        };
    }>;
}
