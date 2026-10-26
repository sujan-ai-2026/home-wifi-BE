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
var RealtimeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeService = void 0;
const common_1 = require("@nestjs/common");
const realtime_gateway_1 = require("./realtime.gateway");
let RealtimeService = RealtimeService_1 = class RealtimeService {
    constructor(gateway) {
        this.gateway = gateway;
        this.logger = new common_1.Logger(RealtimeService_1.name);
    }
    emitSpeedTest(payload) {
        this.logger.debug(`Emitting speed-test.updated: ${payload.id}`);
        this.gateway.broadcast('speed-test.updated', payload);
    }
    emitInternetHealth(payload) {
        this.logger.debug(`Emitting internet-health.updated: ${payload.internetHealth}`);
        this.gateway.broadcast('internet-health.updated', payload);
    }
    emitDevices(payload) {
        this.logger.debug(`Emitting devices.updated: ${payload.totalConnected} devices`);
        this.gateway.broadcast('devices.updated', payload);
    }
    emitDevicesListUpdated(devices) {
        this.logger.debug(`Emitting devices.list.updated`);
        this.gateway.broadcast('devices.list.updated', {
            updatedAt: new Date().toISOString(),
            ...(devices ? { devices } : {}),
        });
    }
    emitAlertCreated(payload) {
        this.logger.log(`Emitting alert.created for ${payload.metric}: ${payload.title || payload.metric}`);
        this.gateway.broadcast('alert.created', payload);
    }
    emitAlertResolved(payload) {
        this.logger.log(`Emitting alert.resolved for ${payload.metric}: ${payload.id}`);
        this.gateway.broadcast('alert.resolved', payload);
    }
    emitDeviceStatusChanged(payload) {
        this.logger.log(`Emitting device.${payload.event}: ${payload.deviceName} (${payload.ipAddress})`);
        this.gateway.broadcast(`device.${payload.event}`, payload);
    }
};
exports.RealtimeService = RealtimeService;
exports.RealtimeService = RealtimeService = RealtimeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [realtime_gateway_1.RealtimeGateway])
], RealtimeService);
//# sourceMappingURL=realtime.service.js.map