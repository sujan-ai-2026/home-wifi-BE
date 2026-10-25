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
var AlertsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_provider_1 = require("../database/database.provider");
const schema_1 = require("../database/schema");
const settings_service_1 = require("../settings/settings.service");
const push_service_1 = require("../push/push.service");
const realtime_service_1 = require("../realtime/realtime.service");
let AlertsService = AlertsService_1 = class AlertsService {
    constructor(db, settingsService, pushService, realtimeService) {
        this.db = db;
        this.settingsService = settingsService;
        this.pushService = pushService;
        this.realtimeService = realtimeService;
        this.logger = new common_1.Logger(AlertsService_1.name);
        this.consecutiveBreaches = {
            download: 0,
            upload: 0,
        };
        this.consecutiveRecoveries = {
            download: 0,
            upload: 0,
        };
    }
    async evaluateMeasurement(downloadMbps, uploadMbps, measuredAt) {
        const settings = await this.settingsService.getSettings();
        await this.evaluateMetric({
            metric: 'download',
            measuredValue: downloadMbps,
            thresholdValue: settings.downloadThresholdMbps,
            recoveryThresholdValue: settings.recoveryThresholdMbps,
            consecutiveRequired: settings.consecutiveBreachesRequired,
            recoveryRequired: settings.recoverySamplesRequired,
            measuredAt,
        });
        await this.evaluateMetric({
            metric: 'upload',
            measuredValue: uploadMbps,
            thresholdValue: settings.uploadThresholdMbps,
            recoveryThresholdValue: settings.recoveryThresholdMbps,
            consecutiveRequired: settings.consecutiveBreachesRequired,
            recoveryRequired: settings.recoverySamplesRequired,
            measuredAt,
        });
    }
    async evaluateMetric(params) {
        const { metric, measuredValue, thresholdValue, recoveryThresholdValue, consecutiveRequired, recoveryRequired, measuredAt, } = params;
        const activeIncidentKey = `low_speed_${metric}_active`;
        const [activeIncident] = await this.db
            .select()
            .from(schema_1.alertEvents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.alertEvents.incidentKey, activeIncidentKey), (0, drizzle_orm_1.eq)(schema_1.alertEvents.status, 'active')))
            .limit(1);
        if (measuredValue < thresholdValue) {
            this.consecutiveBreaches[metric]++;
            this.consecutiveRecoveries[metric] = 0;
            this.logger.warn(`${metric.toUpperCase()} speed breach: ${measuredValue} Mbps < ${thresholdValue} Mbps (consecutive: ${this.consecutiveBreaches[metric]}/${consecutiveRequired})`);
            if (this.consecutiveBreaches[metric] >= consecutiveRequired) {
                if (!activeIncident) {
                    const severity = measuredValue < thresholdValue / 2 ? 'critical' : 'warning';
                    const [newIncident] = await this.db
                        .insert(schema_1.alertEvents)
                        .values({
                        incidentKey: activeIncidentKey,
                        metric,
                        measuredValue: measuredValue.toFixed(2),
                        thresholdValue: thresholdValue.toFixed(2),
                        severity,
                        status: 'active',
                        startedAt: measuredAt,
                        lastBreachAt: measuredAt,
                    })
                        .returning();
                    this.logger.log(`Created new low-speed incident: ${newIncident.id} (${metric})`);
                    this.realtimeService.emitAlertCreated({
                        id: newIncident.id,
                        incidentKey: newIncident.incidentKey,
                        metric: newIncident.metric,
                        measuredValue: parseFloat(newIncident.measuredValue),
                        thresholdValue: parseFloat(newIncident.thresholdValue),
                        severity: newIncident.severity,
                        status: newIncident.status,
                        startedAt: newIncident.startedAt.toISOString(),
                    });
                    this.pushService.sendAlertNotifications(newIncident).catch((err) => {
                        this.logger.error(`Push delivery error: ${err.message}`);
                    });
                }
                else {
                    await this.db
                        .update(schema_1.alertEvents)
                        .set({
                        lastBreachAt: measuredAt,
                        measuredValue: measuredValue.toFixed(2),
                        updatedAt: new Date(),
                    })
                        .where((0, drizzle_orm_1.eq)(schema_1.alertEvents.id, activeIncident.id));
                }
            }
        }
        else if (measuredValue >= recoveryThresholdValue) {
            this.consecutiveRecoveries[metric]++;
            this.consecutiveBreaches[metric] = 0;
            if (activeIncident &&
                this.consecutiveRecoveries[metric] >= recoveryRequired) {
                this.logger.log(`${metric.toUpperCase()} recovered: ${measuredValue} Mbps >= ${recoveryThresholdValue} Mbps. Resolving incident ${activeIncident.id}`);
                const resolvedKey = `low_speed_${metric}_resolved_${activeIncident.id}`;
                const [resolved] = await this.db
                    .update(schema_1.alertEvents)
                    .set({
                    status: 'resolved',
                    resolvedAt: measuredAt,
                    incidentKey: resolvedKey,
                    updatedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.alertEvents.id, activeIncident.id))
                    .returning();
                this.realtimeService.emitAlertResolved({
                    id: resolved.id,
                    incidentKey: resolved.incidentKey,
                    metric: resolved.metric,
                    measuredValue: parseFloat(resolved.measuredValue),
                    thresholdValue: parseFloat(resolved.thresholdValue),
                    severity: resolved.severity,
                    status: resolved.status,
                    startedAt: resolved.startedAt.toISOString(),
                    resolvedAt: resolved.resolvedAt?.toISOString() || null,
                });
            }
        }
        else {
            this.consecutiveBreaches[metric] = 0;
            this.consecutiveRecoveries[metric] = 0;
        }
    }
    async listAlerts(query) {
        const conditions = [];
        if (query.status) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.alertEvents.status, query.status));
        }
        if (query.metric) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.alertEvents.metric, query.metric));
        }
        const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
        const [totalResult] = await this.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.alertEvents)
            .where(whereClause);
        const total = Number(totalResult?.count || 0);
        const items = await this.db
            .select()
            .from(schema_1.alertEvents)
            .where(whereClause)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.alertEvents.startedAt))
            .limit(query.limit)
            .offset(query.offset);
        return {
            items: items.map((a) => {
                let title = `${a.metric.toUpperCase()} speed below threshold`;
                let detail = `Measured ${a.measuredValue} Mbps (threshold: ${a.thresholdValue} Mbps)`;
                if (a.metric === 'device_connected') {
                    title = 'New Device Connected';
                    detail = a.incidentKey.includes('::') ? a.incidentKey.split('::')[1] : 'Device joined the network';
                }
                else if (a.metric === 'device_disconnected') {
                    title = 'Device Disconnected';
                    detail = a.incidentKey.includes('::') ? a.incidentKey.split('::')[1] : 'Device left the network';
                }
                return {
                    ...a,
                    measuredValue: parseFloat(a.measuredValue),
                    thresholdValue: parseFloat(a.thresholdValue),
                    title,
                    detail,
                    timestamp: a.startedAt.toISOString(),
                    acknowledged: a.status === 'resolved',
                };
            }),
            meta: {
                page: query.page,
                limit: query.limit,
                totalItems: total,
                totalPages: Math.ceil(total / query.limit) || 1,
            },
        };
    }
    async purgeOldAlerts() {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const result = await this.db
            .delete(schema_1.alertEvents)
            .where((0, drizzle_orm_1.sql) `${schema_1.alertEvents.createdAt} < ${twoDaysAgo}`);
        this.logger.log(`Purged old alerts from database`);
        return result;
    }
    async getAlertById(id) {
        const [alert] = await this.db
            .select()
            .from(schema_1.alertEvents)
            .where((0, drizzle_orm_1.eq)(schema_1.alertEvents.id, id))
            .limit(1);
        if (!alert) {
            throw new common_1.NotFoundException(`Alert incident with ID ${id} not found`);
        }
        const deliveries = await this.db
            .select()
            .from(schema_1.notificationDeliveries)
            .where((0, drizzle_orm_1.eq)(schema_1.notificationDeliveries.alertEventId, id));
        return {
            ...alert,
            measuredValue: parseFloat(alert.measuredValue),
            thresholdValue: parseFloat(alert.thresholdValue),
            notificationDeliveries: deliveries,
        };
    }
    async getActiveIncidentCount() {
        const [result] = await this.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.alertEvents)
            .where((0, drizzle_orm_1.eq)(schema_1.alertEvents.status, 'active'));
        return Number(result?.count || 0);
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = AlertsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_provider_1.DRIZZLE_ORM)),
    __metadata("design:paramtypes", [Object, settings_service_1.SettingsService,
        push_service_1.PushService,
        realtime_service_1.RealtimeService])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map