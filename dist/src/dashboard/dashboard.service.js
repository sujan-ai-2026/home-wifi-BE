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
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const speed_tests_service_1 = require("../speed-tests/speed-tests.service");
const network_collector_service_1 = require("../network-collector/network-collector.service");
const devices_service_1 = require("../devices/devices.service");
const alerts_service_1 = require("../alerts/alerts.service");
const router_service_1 = require("../router/router.service");
let DashboardService = DashboardService_1 = class DashboardService {
    constructor(speedTestsService, collectorService, devicesService, alertsService, routerService) {
        this.speedTestsService = speedTestsService;
        this.collectorService = collectorService;
        this.devicesService = devicesService;
        this.alertsService = alertsService;
        this.routerService = routerService;
        this.logger = new common_1.Logger(DashboardService_1.name);
    }
    async getOverview() {
        const [speedTelemetry, healthState, onlineDevices, activeAlerts, latestSnapshot, history] = await Promise.all([
            this.speedTestsService.getLatest(),
            this.collectorService.getHealthState(),
            this.devicesService.getOnlineDeviceCount(),
            this.alertsService.getActiveIncidentCount(),
            this.routerService.getLatestSnapshot(),
            this.speedTestsService.getHistory({
                page: 1,
                limit: 10,
                status: 'success',
                offset: 0,
            }),
        ]);
        const wanConnected = latestSnapshot?.wanConnected ?? healthState.wanConnected;
        const routerStatus = latestSnapshot?.status ?? 'unverified';
        const speedHistory = (history?.items || [])
            .slice()
            .reverse()
            .map((t) => {
            const d = new Date(t.measuredAt);
            const timeStr = isNaN(d.getTime())
                ? t.measuredAt
                : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            return {
                timestamp: timeStr,
                downloadMbps: t.downloadMbps,
                uploadMbps: t.uploadMbps,
            };
        });
        const nowIso = new Date().toISOString();
        return {
            internetHealthState: healthState.internetHealth,
            routerReachable: healthState.routerReachable,
            wanConnected,
            routerStatus,
            measurementFreshness: {
                isStale: speedTelemetry.isStale,
                freshnessSeconds: speedTelemetry.freshnessSeconds,
            },
            latestSuccessful: speedTelemetry.latestSuccessful,
            latestAttempt: speedTelemetry.latestAttempt,
            activeLowSpeedIncidents: activeAlerts,
            connectedDeviceCount: onlineDevices,
            lastRouterObservation: latestSnapshot
                ? {
                    observedAt: latestSnapshot.observedAt.toISOString(),
                    status: latestSnapshot.status,
                    wanConnected: latestSnapshot.wanConnected,
                    routerUptimeSeconds: latestSnapshot.routerUptimeSeconds,
                    receivedBytes: latestSnapshot.receivedBytes,
                    transmittedBytes: latestSnapshot.transmittedBytes,
                }
                : null,
            generatedAt: nowIso,
            status: healthState.internetHealth,
            downloadMbps: speedTelemetry.latestSuccessful?.downloadMbps ?? null,
            uploadMbps: speedTelemetry.latestSuccessful?.uploadMbps ?? null,
            latencyMs: speedTelemetry.latestSuccessful?.latencyMs ?? null,
            jitterMs: speedTelemetry.latestSuccessful?.jitterMs ?? null,
            connectedDevices: onlineDevices,
            lastUpdated: speedTelemetry.latestSuccessful?.measuredAt ?? nowIso,
            speedHistory,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [speed_tests_service_1.SpeedTestsService,
        network_collector_service_1.NetworkCollectorService,
        devices_service_1.DevicesService,
        alerts_service_1.AlertsService,
        router_service_1.RouterService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map