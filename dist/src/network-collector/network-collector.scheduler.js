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
var NetworkCollectorScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkCollectorScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const network_collector_service_1 = require("./network-collector.service");
const router_service_1 = require("../router/router.service");
const devices_service_1 = require("../devices/devices.service");
const realtime_service_1 = require("../realtime/realtime.service");
const alerts_service_1 = require("../alerts/alerts.service");
let NetworkCollectorScheduler = NetworkCollectorScheduler_1 = class NetworkCollectorScheduler {
    constructor(collectorService, routerService, devicesService, realtimeService, alertsService) {
        this.collectorService = collectorService;
        this.routerService = routerService;
        this.devicesService = devicesService;
        this.realtimeService = realtimeService;
        this.alertsService = alertsService;
        this.logger = new common_1.Logger(NetworkCollectorScheduler_1.name);
        this.isCollecting = false;
    }
    async handleAlertPurge() {
        try {
            await this.alertsService.purgeOldAlerts();
        }
        catch (err) {
            this.logger.error(`Alert purge error: ${err.message}`);
        }
    }
    async handlePeriodicCollection() {
        if (this.isCollecting)
            return;
        this.isCollecting = true;
        try {
            const discovered = await this.routerService.getConnectedDevices();
            if (discovered && discovered.length > 0) {
                await this.devicesService.ingestDiscoveredDevices(discovered);
            }
            const health = await this.collectorService.getHealthState();
            this.realtimeService.emitInternetHealth({
                internetHealth: health.internetHealth,
                routerReachable: health.routerReachable,
                wanConnected: health.wanConnected,
                externalReachable: health.externalReachable,
                measurementStale: health.measurementStale,
                checkedAt: health.checkedAt,
            });
        }
        catch (err) {
            this.logger.error(`Periodic network telemetry collection error: ${err.message}`);
        }
        finally {
            this.isCollecting = false;
        }
    }
};
exports.NetworkCollectorScheduler = NetworkCollectorScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NetworkCollectorScheduler.prototype, "handleAlertPurge", null);
__decorate([
    (0, schedule_1.Cron)('*/10 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NetworkCollectorScheduler.prototype, "handlePeriodicCollection", null);
exports.NetworkCollectorScheduler = NetworkCollectorScheduler = NetworkCollectorScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [network_collector_service_1.NetworkCollectorService,
        router_service_1.RouterService,
        devices_service_1.DevicesService,
        realtime_service_1.RealtimeService,
        alerts_service_1.AlertsService])
], NetworkCollectorScheduler);
//# sourceMappingURL=network-collector.scheduler.js.map