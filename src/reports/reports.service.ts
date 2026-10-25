import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { and, gte, lt, eq, sql } from 'drizzle-orm';
import { DRIZZLE_ORM, DrizzleDb } from '../database/database.provider';
import { speedTests, alertEvents, routerSnapshots, dailyMetrics } from '../database/schema';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @Inject(DRIZZLE_ORM) private readonly db: DrizzleDb,
    private readonly settingsService: SettingsService,
  ) {}

  private parseMonthRange(monthStr: string) {
    const parts = monthStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new BadRequestException('Invalid month format, expected YYYY-MM');
    }

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

    return { start, end, year, month };
  }

  async getMonthlyReport(monthStr: string) {
    const { start, end } = this.parseMonthRange(monthStr);
    const settings = await this.settingsService.getSettings();

    // Query successful tests for speed aggregations
    const successfulTests = await this.db
      .select()
      .from(speedTests)
      .where(
        and(
          gte(speedTests.measuredAt, start),
          lt(speedTests.measuredAt, end),
          eq(speedTests.status, 'success'),
        ),
      );

    // Query failed tests count
    const failedTests = await this.db
      .select()
      .from(speedTests)
      .where(
        and(
          gte(speedTests.measuredAt, start),
          lt(speedTests.measuredAt, end),
          eq(speedTests.status, 'failed'),
        ),
      );

    const totalSuccessful = successfulTests.length;
    const totalFailed = failedTests.length;
    const totalTests = totalSuccessful + totalFailed;

    let avgDownload: number | null = null;
    let avgUpload: number | null = null;
    let minDownload: number | null = null;
    let maxDownload: number | null = null;
    let minUpload: number | null = null;
    let maxUpload: number | null = null;

    if (totalSuccessful > 0) {
      const downloads = successfulTests
        .map((t) => (t.downloadMbps ? parseFloat(t.downloadMbps) : null))
        .filter((v): v is number => v !== null);

      const uploads = successfulTests
        .map((t) => (t.uploadMbps ? parseFloat(t.uploadMbps) : null))
        .filter((v): v is number => v !== null);

      if (downloads.length > 0) {
        avgDownload = parseFloat(
          (downloads.reduce((a, b) => a + b, 0) / downloads.length).toFixed(2),
        );
        minDownload = Math.min(...downloads);
        maxDownload = Math.max(...downloads);
      }

      if (uploads.length > 0) {
        avgUpload = parseFloat(
          (uploads.reduce((a, b) => a + b, 0) / uploads.length).toFixed(2),
        );
        minUpload = Math.min(...uploads);
        maxUpload = Math.max(...uploads);
      }
    }

    // Incidents count in the month
    const incidents = await this.db
      .select()
      .from(alertEvents)
      .where(
        and(
          gte(alertEvents.startedAt, start),
          lt(alertEvents.startedAt, end),
        ),
      );

    // Uptime estimation
    const snapshots = await this.db
      .select()
      .from(routerSnapshots)
      .where(
        and(
          gte(routerSnapshots.observedAt, start),
          lt(routerSnapshots.observedAt, end),
        ),
      );

    let estimatedUptimePercentage: number | null = null;
    let outageDurationSeconds: number = 0;

    if (snapshots.length > 0) {
      const connected = snapshots.filter((s) => s.wanConnected === true).length;
      estimatedUptimePercentage = parseFloat(
        ((connected / snapshots.length) * 100).toFixed(2),
      );
      const unreachableCount = snapshots.filter((s) => s.wanConnected === false).length;
      outageDurationSeconds = unreachableCount * settings.routerPollIntervalSeconds;
    } else if (totalTests > 0) {
      // Fallback estimate based on speed tests
      estimatedUptimePercentage = parseFloat(
        ((totalSuccessful / totalTests) * 100).toFixed(2),
      );
    }

    // Data usage calculation with counter reset handling
    let totalReceivedBytes: number | null = null;
    let totalTransmittedBytes: number | null = null;

    const validSnapshotsWithCounters = snapshots.filter(
      (s) => s.receivedBytes !== null && s.transmittedBytes !== null,
    );

    if (validSnapshotsWithCounters.length >= 2) {
      const first = validSnapshotsWithCounters[0];
      const last = validSnapshotsWithCounters[validSnapshotsWithCounters.length - 1];

      if (
        last.receivedBytes! >= first.receivedBytes! &&
        last.transmittedBytes! >= first.transmittedBytes!
      ) {
        totalReceivedBytes = last.receivedBytes! - first.receivedBytes!;
        totalTransmittedBytes = last.transmittedBytes! - first.transmittedBytes!;
      }
    }

    return {
      month: monthStr,
      averageDownloadMbps: avgDownload,
      averageUploadMbps: avgUpload,
      minimumDownloadMbps: minDownload,
      maximumDownloadMbps: maxDownload,
      minimumUploadMbps: minUpload,
      maximumUploadMbps: maxUpload,
      totalSuccessfulTests: totalSuccessful,
      totalFailedTests: totalFailed,
      totalTests,
      estimatedUptimePercentage,
      outageDurationSeconds,
      distinctLowSpeedIncidentCount: incidents.length,
      wanDataUsage: {
        receivedBytes: totalReceivedBytes,
        transmittedBytes: totalTransmittedBytes,
        receivedGigabytes: totalReceivedBytes
          ? parseFloat((totalReceivedBytes / 1e9).toFixed(2))
          : null,
        transmittedGigabytes: totalTransmittedBytes
          ? parseFloat((totalTransmittedBytes / 1e9).toFixed(2))
          : null,
      },
      generatedAt: new Date().toISOString(),
      timezone: settings.timezone,
      // Frontend dashboard compatibility
      period: monthStr,
      uptimePercent: estimatedUptimePercentage,
      outageMinutes: Math.round(outageDurationSeconds / 60),
      incidents: incidents.length,
      usageGb: totalReceivedBytes
        ? parseFloat((totalReceivedBytes / 1e9).toFixed(2))
        : null,
    };
  }

  async getDailyReport(dateStr: string) {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));

    const tests = await this.db
      .select()
      .from(speedTests)
      .where(
        and(
          gte(speedTests.measuredAt, start),
          lt(speedTests.measuredAt, end),
          eq(speedTests.status, 'success'),
        ),
      );

    const downloads = tests
      .map((t) => (t.downloadMbps ? parseFloat(t.downloadMbps) : null))
      .filter((v): v is number => v !== null);

    const uploads = tests
      .map((t) => (t.uploadMbps ? parseFloat(t.uploadMbps) : null))
      .filter((v): v is number => v !== null);

    const avgDownload =
      downloads.length > 0
        ? parseFloat((downloads.reduce((a, b) => a + b, 0) / downloads.length).toFixed(2))
        : null;
    const avgUpload =
      uploads.length > 0
        ? parseFloat((uploads.reduce((a, b) => a + b, 0) / uploads.length).toFixed(2))
        : null;

    return {
      date: dateStr,
      averageDownloadMbps: avgDownload,
      averageUploadMbps: avgUpload,
      successfulTestsCount: tests.length,
      minimumDownloadMbps: downloads.length > 0 ? Math.min(...downloads) : null,
      maximumDownloadMbps: downloads.length > 0 ? Math.max(...downloads) : null,
      minimumUploadMbps: uploads.length > 0 ? Math.min(...uploads) : null,
      maximumUploadMbps: uploads.length > 0 ? Math.max(...uploads) : null,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Sanitizes cell string to protect against spreadsheet formula injection (=, +, -, @)
   */
  private sanitizeCsvCell(val: string | number | null | undefined): string {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  async exportMonthlyCsv(monthStr: string): Promise<string> {
    const { start, end } = this.parseMonthRange(monthStr);

    const tests = await this.db
      .select()
      .from(speedTests)
      .where(
        and(
          gte(speedTests.measuredAt, start),
          lt(speedTests.measuredAt, end),
        ),
      );

    const headers = [
      'Timestamp (UTC)',
      'Status',
      'Download (Mbps)',
      'Upload (Mbps)',
      'Latency (ms)',
      'Jitter (ms)',
      'Server Name',
      'Provider',
      'Error Code',
    ];

    const rows = tests.map((t) => [
      this.sanitizeCsvCell(t.measuredAt.toISOString()),
      this.sanitizeCsvCell(t.status),
      this.sanitizeCsvCell(t.downloadMbps),
      this.sanitizeCsvCell(t.uploadMbps),
      this.sanitizeCsvCell(t.latencyMs),
      this.sanitizeCsvCell(t.jitterMs),
      this.sanitizeCsvCell(t.serverName),
      this.sanitizeCsvCell(t.provider),
      this.sanitizeCsvCell(t.errorCode),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csvContent;
  }
}
