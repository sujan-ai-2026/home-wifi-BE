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
var SettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_provider_1 = require("../database/database.provider");
const schema_1 = require("../database/schema");
let SettingsService = SettingsService_1 = class SettingsService {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(SettingsService_1.name);
    }
    async onModuleInit() {
        await this.ensureSettingsRow();
    }
    async ensureSettingsRow() {
        try {
            const existing = await this.db.select().from(schema_1.appSettings).where((0, drizzle_orm_1.eq)(schema_1.appSettings.id, 1)).limit(1);
            if (existing.length === 0) {
                await this.db.insert(schema_1.appSettings).values({
                    id: 1,
                    downloadThresholdMbps: '10.00',
                    uploadThresholdMbps: '10.00',
                    consecutiveBreachesRequired: 2,
                    recoveryThresholdMbps: '12.00',
                    recoverySamplesRequired: 1,
                    speedTestIntervalMinutes: 15,
                    routerPollIntervalSeconds: 60,
                    timezone: 'Asia/Kolkata',
                    retentionDays: 90,
                    notificationsEnabled: true,
                });
                this.logger.log('Default application settings initialized');
            }
        }
        catch (err) {
            this.logger.error(`Error ensuring default app settings: ${err.message}`);
        }
    }
    async getSettings() {
        const [row] = await this.db.select().from(schema_1.appSettings).where((0, drizzle_orm_1.eq)(schema_1.appSettings.id, 1)).limit(1);
        if (!row) {
            await this.ensureSettingsRow();
            return this.getSettings();
        }
        return {
            id: row.id,
            downloadThresholdMbps: parseFloat(row.downloadThresholdMbps),
            uploadThresholdMbps: parseFloat(row.uploadThresholdMbps),
            consecutiveBreachesRequired: row.consecutiveBreachesRequired,
            recoveryThresholdMbps: parseFloat(row.recoveryThresholdMbps),
            recoverySamplesRequired: row.recoverySamplesRequired,
            speedTestIntervalMinutes: row.speedTestIntervalMinutes,
            routerPollIntervalSeconds: row.routerPollIntervalSeconds,
            timezone: row.timezone,
            retentionDays: row.retentionDays,
            updatedAt: row.updatedAt.toISOString(),
            routerName: 'HomeNet Gateway / Airtel Xstream Fiber',
            routerStatus: 'connected',
            monitoringIntervalSeconds: row.routerPollIntervalSeconds,
            speedThresholdMbps: parseFloat(row.downloadThresholdMbps),
            notificationsEnabled: row.notificationsEnabled ?? true,
        };
    }
    async updateSettings(dto) {
        const updateData = {
            updatedAt: new Date(),
        };
        const dlThreshold = dto.downloadThresholdMbps ?? dto.speedThresholdMbps;
        if (dlThreshold !== undefined) {
            updateData.downloadThresholdMbps = dlThreshold.toFixed(2);
        }
        if (dto.uploadThresholdMbps !== undefined) {
            updateData.uploadThresholdMbps = dto.uploadThresholdMbps.toFixed(2);
        }
        if (dto.consecutiveBreachesRequired !== undefined) {
            updateData.consecutiveBreachesRequired = dto.consecutiveBreachesRequired;
        }
        if (dto.recoveryThresholdMbps !== undefined) {
            updateData.recoveryThresholdMbps = dto.recoveryThresholdMbps.toFixed(2);
        }
        if (dto.recoverySamplesRequired !== undefined) {
            updateData.recoverySamplesRequired = dto.recoverySamplesRequired;
        }
        if (dto.speedTestIntervalMinutes !== undefined) {
            updateData.speedTestIntervalMinutes = dto.speedTestIntervalMinutes;
        }
        const pollInterval = dto.routerPollIntervalSeconds ?? dto.monitoringIntervalSeconds;
        if (pollInterval !== undefined) {
            updateData.routerPollIntervalSeconds = pollInterval;
        }
        if (dto.timezone !== undefined) {
            updateData.timezone = dto.timezone;
        }
        if (dto.retentionDays !== undefined) {
            updateData.retentionDays = dto.retentionDays;
        }
        if (dto.notificationsEnabled !== undefined) {
            updateData.notificationsEnabled = Boolean(dto.notificationsEnabled);
        }
        await this.db.update(schema_1.appSettings).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.appSettings.id, 1));
        return this.getSettings();
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_provider_1.DRIZZLE_ORM)),
    __metadata("design:paramtypes", [Object])
], SettingsService);
//# sourceMappingURL=settings.service.js.map