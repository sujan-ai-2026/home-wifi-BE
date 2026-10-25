import { DrizzleDb } from '../database/database.provider';
import { SettingsService } from '../settings/settings.service';
export declare class ReportsService {
    private readonly db;
    private readonly settingsService;
    private readonly logger;
    constructor(db: DrizzleDb, settingsService: SettingsService);
    private parseMonthRange;
    getMonthlyReport(monthStr: string): Promise<{
        month: string;
        averageDownloadMbps: number | null;
        averageUploadMbps: number | null;
        minimumDownloadMbps: number | null;
        maximumDownloadMbps: number | null;
        minimumUploadMbps: number | null;
        maximumUploadMbps: number | null;
        totalSuccessfulTests: number;
        totalFailedTests: number;
        totalTests: number;
        estimatedUptimePercentage: number | null;
        outageDurationSeconds: number;
        distinctLowSpeedIncidentCount: number;
        wanDataUsage: {
            receivedBytes: number | null;
            transmittedBytes: number | null;
            receivedGigabytes: number | null;
            transmittedGigabytes: number | null;
        };
        generatedAt: string;
        timezone: string;
        period: string;
        uptimePercent: number | null;
        outageMinutes: number;
        incidents: number;
        usageGb: number | null;
    }>;
    getDailyReport(dateStr: string): Promise<{
        date: string;
        averageDownloadMbps: number | null;
        averageUploadMbps: number | null;
        successfulTestsCount: number;
        minimumDownloadMbps: number | null;
        maximumDownloadMbps: number | null;
        minimumUploadMbps: number | null;
        maximumUploadMbps: number | null;
        generatedAt: string;
    }>;
    private sanitizeCsvCell;
    exportMonthlyCsv(monthStr: string): Promise<string>;
}
