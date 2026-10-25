"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_provider_1 = require("../database/database.provider");
const schema_1 = require("../database/schema");
const settings_service_1 = require("../settings/settings.service");
let ReportsService = ReportsService_1 = class ReportsService {
    constructor(db, settingsService) {
        this.db = db;
        this.settingsService = settingsService;
        this.logger = new common_1.Logger(ReportsService_1.name);
    }
    parseMonthRange(monthStr) {
        const parts = monthStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            throw new common_1.BadRequestException('Invalid month format, expected YYYY-MM');
        }
        const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
        return { start, end, year, month };
    }
    async getMonthlyReport(monthStr) {
        const { start, end } = this.parseMonthRange(monthStr);
        const settings = await this.settingsService.getSettings();
        const successfulTests = await this.db
            .select()
            .from(schema_1.speedTests)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.speedTests.measuredAt, start), (0, drizzle_orm_1.lt)(schema_1.speedTests.measuredAt, end), (0, drizzle_orm_1.eq)(schema_1.speedTests.status, 'success')));
        const failedTests = await this.db
            .select()
            .from(schema_1.speedTests)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.speedTests.measuredAt, start), (0, drizzle_orm_1.lt)(schema_1.speedTests.measuredAt, end), (0, drizzle_orm_1.eq)(schema_1.speedTests.status, 'failed')));
        const totalSuccessful = successfulTests.length;
        const totalFailed = failedTests.length;
        const totalTests = totalSuccessful + totalFailed;
        let avgDownload = null;
        let avgUpload = null;
        let minDownload = null;
        let maxDownload = null;
        let minUpload = null;
        let maxUpload = null;
        if (totalSuccessful > 0) {
            const downloads = successfulTests
                .map((t) => (t.downloadMbps ? parseFloat(t.downloadMbps) : null))
                .filter((v) => v !== null);
            const uploads = successfulTests
                .map((t) => (t.uploadMbps ? parseFloat(t.uploadMbps) : null))
                .filter((v) => v !== null);
            if (downloads.length > 0) {
                avgDownload = parseFloat((downloads.reduce((a, b) => a + b, 0) / downloads.length).toFixed(2));
                minDownload = Math.min(...downloads);
                maxDownload = Math.max(...downloads);
            }
            if (uploads.length > 0) {
                avgUpload = parseFloat((uploads.reduce((a, b) => a + b, 0) / uploads.length).toFixed(2));
                minUpload = Math.min(...uploads);
                maxUpload = Math.max(...uploads);
            }
        }
        const incidents = await this.db
            .select()
            .from(schema_1.alertEvents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.alertEvents.startedAt, start), (0, drizzle_orm_1.lt)(schema_1.alertEvents.startedAt, end)));
        const snapshots = await this.db
            .select()
            .from(schema_1.routerSnapshots)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.routerSnapshots.observedAt, start), (0, drizzle_orm_1.lt)(schema_1.routerSnapshots.observedAt, end)));
        let estimatedUptimePercentage = null;
        let outageDurationSeconds = 0;
        if (snapshots.length > 0) {
            const connected = snapshots.filter((s) => s.wanConnected === true).length;
            estimatedUptimePercentage = parseFloat(((connected / snapshots.length) * 100).toFixed(2));
            const unreachableCount = snapshots.filter((s) => s.wanConnected === false).length;
            outageDurationSeconds = unreachableCount * settings.routerPollIntervalSeconds;
        }
        else if (totalTests > 0) {
            estimatedUptimePercentage = parseFloat(((totalSuccessful / totalTests) * 100).toFixed(2));
        }
        let totalReceivedBytes = null;
        let totalTransmittedBytes = null;
        const validSnapshotsWithCounters = snapshots.filter((s) => s.receivedBytes !== null && s.transmittedBytes !== null);
        if (validSnapshotsWithCounters.length >= 2) {
            const first = validSnapshotsWithCounters[0];
            const last = validSnapshotsWithCounters[validSnapshotsWithCounters.length - 1];
            if (last.receivedBytes >= first.receivedBytes &&
                last.transmittedBytes >= first.transmittedBytes) {
                totalReceivedBytes = last.receivedBytes - first.receivedBytes;
                totalTransmittedBytes = last.transmittedBytes - first.transmittedBytes;
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
            period: monthStr,
            uptimePercent: estimatedUptimePercentage,
            outageMinutes: Math.round(outageDurationSeconds / 60),
            incidents: incidents.length,
            usageGb: totalReceivedBytes
                ? parseFloat((totalReceivedBytes / 1e9).toFixed(2))
                : null,
        };
    }
    async getDailyReport(dateStr) {
        const parts = dateStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const end = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
        const tests = await this.db
            .select()
            .from(schema_1.speedTests)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.speedTests.measuredAt, start), (0, drizzle_orm_1.lt)(schema_1.speedTests.measuredAt, end), (0, drizzle_orm_1.eq)(schema_1.speedTests.status, 'success')));
        const downloads = tests
            .map((t) => (t.downloadMbps ? parseFloat(t.downloadMbps) : null))
            .filter((v) => v !== null);
        const uploads = tests
            .map((t) => (t.uploadMbps ? parseFloat(t.uploadMbps) : null))
            .filter((v) => v !== null);
        const avgDownload = downloads.length > 0
            ? parseFloat((downloads.reduce((a, b) => a + b, 0) / downloads.length).toFixed(2))
            : null;
        const avgUpload = uploads.length > 0
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
    sanitizeCsvCell(val) {
        if (val === null || val === undefined)
            return '';
        let str = String(val);
        if (/^[=+\-@\t\r]/.test(str)) {
            str = `'${str}`;
        }
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            str = `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }
    async exportMonthlyCsv(monthStr) {
        const { start, end } = this.parseMonthRange(monthStr);
        const tests = await this.db
            .select()
            .from(schema_1.speedTests)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.speedTests.measuredAt, start), (0, drizzle_orm_1.lt)(schema_1.speedTests.measuredAt, end)));
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
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_provider_1.DRIZZLE_ORM)),
    __metadata("design:paramtypes", [Object, settings_service_1.SettingsService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map