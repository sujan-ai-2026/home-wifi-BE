import { SpeedTestsService } from './speed-tests.service';
import { SpeedTestHistoryQueryDto } from './dto/speed-test-history-query.dto';
export declare class SpeedTestsController {
    private readonly speedTestsService;
    constructor(speedTestsService: SpeedTestsService);
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
    runTest(): Promise<import("./providers/speed-test-provider.interface").SpeedTestResult>;
}
