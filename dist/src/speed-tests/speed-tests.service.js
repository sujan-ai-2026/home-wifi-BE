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
var SpeedTestsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeedTestsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_provider_1 = require("../database/database.provider");
const schema_1 = require("../database/schema");
const cli_speed_test_provider_1 = require("./providers/cli-speed-test.provider");
const alerts_service_1 = require("../alerts/alerts.service");
const realtime_service_1 = require("../realtime/realtime.service");
const settings_service_1 = require("../settings/settings.service");
let SpeedTestsService = SpeedTestsService_1 = class SpeedTestsService {
    constructor(db, cliProvider, alertsService, realtimeService, settingsService) {
        this.db = db;
        this.cliProvider = cliProvider;
        this.alertsService = alertsService;
        this.realtimeService = realtimeService;
        this.settingsService = settingsService;
        this.logger = new common_1.Logger(SpeedTestsService_1.name);
        this.isRunning = false;
    }
    async runTest() {
        if (this.isRunning) {
            throw new common_1.ConflictException('A speed test is already in progress');
        }
        this.isRunning = true;
        try {
            const result = await this.cliProvider.execute();
            const [record] = await this.db
                .insert(schema_1.speedTests)
                .values({
                downloadMbps: result.downloadMbps !== null ? result.downloadMbps.toFixed(2) : null,
                uploadMbps: result.uploadMbps !== null ? result.uploadMbps.toFixed(2) : null,
                latencyMs: result.latencyMs !== null ? result.latencyMs.toFixed(2) : null,
                jitterMs: result.jitterMs !== null ? result.jitterMs.toFixed(2) : null,
                serverName: result.serverName,
                provider: result.provider,
                status: result.status,
                errorCode: result.errorCode ?? null,
                errorMessage: result.errorMessage ?? null,
                measuredAt: result.measuredAt,
            })
                .returning();
            if (result.status === 'success' &&
                result.downloadMbps !== null &&
                result.uploadMbps !== null) {
                await this.alertsService.evaluateMeasurement(result.downloadMbps, result.uploadMbps, result.measuredAt);
            }
            this.realtimeService.emitSpeedTest({
                id: record.id,
                downloadMbps: result.downloadMbps,
                uploadMbps: result.uploadMbps,
                latencyMs: result.latencyMs,
                jitterMs: result.jitterMs,
                status: result.status,
                measuredAt: result.measuredAt.toISOString(),
            });
            return result;
        }
        finally {
            this.isRunning = false;
        }
    }
    async getLatest() {
        const [latestAttempt] = await this.db
            .select()
            .from(schema_1.speedTests)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.speedTests.measuredAt))
            .limit(1);
        const [latestSuccess] = await this.db
            .select()
            .from(schema_1.speedTests)
            .where((0, drizzle_orm_1.eq)(schema_1.speedTests.status, 'success'))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.speedTests.measuredAt))
            .limit(1);
        const settings = await this.settingsService.getSettings();
        const staleThresholdMs = settings.speedTestIntervalMinutes * 2 * 60 * 1000;
        let isStale = false;
        let freshnessSeconds = null;
        if (latestSuccess) {
            const ageMs = Date.now() - new Date(latestSuccess.measuredAt).getTime();
            freshnessSeconds = Math.floor(ageMs / 1000);
            isStale = ageMs > staleThresholdMs;
        }
        else {
            isStale = true;
        }
        return {
            latestSuccessful: latestSuccess
                ? {
                    id: latestSuccess.id,
                    downloadMbps: latestSuccess.downloadMbps ? parseFloat(latestSuccess.downloadMbps) : null,
                    uploadMbps: latestSuccess.uploadMbps ? parseFloat(latestSuccess.uploadMbps) : null,
                    latencyMs: latestSuccess.latencyMs ? parseFloat(latestSuccess.latencyMs) : null,
                    jitterMs: latestSuccess.jitterMs ? parseFloat(latestSuccess.jitterMs) : null,
                    serverName: latestSuccess.serverName,
                    provider: latestSuccess.provider,
                    measuredAt: latestSuccess.measuredAt.toISOString(),
                }
                : null,
            latestAttempt: latestAttempt
                ? {
                    id: latestAttempt.id,
                    status: latestAttempt.status,
                    errorCode: latestAttempt.errorCode,
                    errorMessage: latestAttempt.errorMessage,
                    measuredAt: latestAttempt.measuredAt.toISOString(),
                }
                : null,
            isStale,
            freshnessSeconds,
        };
    }
    async getHistory(query) {
        const conditions = [];
        if (query.status) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.speedTests.status, query.status));
        }
        if (query.from) {
            conditions.push((0, drizzle_orm_1.gte)(schema_1.speedTests.measuredAt, new Date(query.from)));
        }
        if (query.to) {
            conditions.push((0, drizzle_orm_1.lte)(schema_1.speedTests.measuredAt, new Date(query.to)));
        }
        const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
        const [totalResult] = await this.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.speedTests)
            .where(whereClause);
        const total = Number(totalResult?.count || 0);
        const rows = await this.db
            .select()
            .from(schema_1.speedTests)
            .where(whereClause)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.speedTests.measuredAt))
            .limit(query.limit)
            .offset(query.offset);
        const items = rows.map((r) => ({
            id: r.id,
            downloadMbps: r.downloadMbps ? parseFloat(r.downloadMbps) : null,
            uploadMbps: r.uploadMbps ? parseFloat(r.uploadMbps) : null,
            latencyMs: r.latencyMs ? parseFloat(r.latencyMs) : null,
            jitterMs: r.jitterMs ? parseFloat(r.jitterMs) : null,
            serverName: r.serverName,
            provider: r.provider,
            status: r.status,
            errorCode: r.errorCode,
            errorMessage: r.errorMessage,
            measuredAt: r.measuredAt.toISOString(),
            createdAt: r.createdAt.toISOString(),
        }));
        return {
            items,
            meta: {
                page: query.page,
                limit: query.limit,
                totalItems: total,
                totalPages: Math.ceil(total / query.limit) || 1,
            },
        };
    }
};
exports.SpeedTestsService = SpeedTestsService;
exports.SpeedTestsService = SpeedTestsService = SpeedTestsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_provider_1.DRIZZLE_ORM)),
    __metadata("design:paramtypes", [Object, cli_speed_test_provider_1.CliSpeedTestProvider,
        alerts_service_1.AlertsService,
        realtime_service_1.RealtimeService,
        settings_service_1.SettingsService])
], SpeedTestsService);
//# sourceMappingURL=speed-tests.service.js.map