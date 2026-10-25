import { Response } from 'express';
import { ReportsService } from './reports.service';
import { MonthlyReportQueryDto, DailyReportQueryDto } from './dto/report-query.dto';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getMonthlyReport(query: MonthlyReportQueryDto): Promise<{
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
    getDailyReport(query: DailyReportQueryDto): Promise<{
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
    exportCsv(query: MonthlyReportQueryDto, res: Response): Promise<void>;
}
