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
var NetworkCollectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkCollectorService = void 0;
const common_1 = require("@nestjs/common");
const net = require("net");
const router_service_1 = require("../router/router.service");
const speed_tests_service_1 = require("../speed-tests/speed-tests.service");
const realtime_service_1 = require("../realtime/realtime.service");
let NetworkCollectorService = NetworkCollectorService_1 = class NetworkCollectorService {
    constructor(routerService, speedTestsService, realtimeService) {
        this.routerService = routerService;
        this.speedTestsService = speedTestsService;
        this.realtimeService = realtimeService;
        this.logger = new common_1.Logger(NetworkCollectorService_1.name);
        this.externalProbeTargets = [
            { host: '1.1.1.1', port: 53 },
            { host: '8.8.8.8', port: 53 },
        ];
    }
    async probeTcpEndpoint(host, port, timeoutMs = 2000) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            let resolved = false;
            socket.setTimeout(timeoutMs);
            socket.on('connect', () => {
                if (!resolved) {
                    resolved = true;
                    socket.destroy();
                    resolve(true);
                }
            });
            socket.on('timeout', () => {
                if (!resolved) {
                    resolved = true;
                    socket.destroy();
                    resolve(false);
                }
            });
            socket.on('error', () => {
                if (!resolved) {
                    resolved = true;
                    socket.destroy();
                    resolve(false);
                }
            });
            socket.connect(port, host);
        });
    }
    async checkExternalInternetReachable() {
        const results = await Promise.all(this.externalProbeTargets.map((target) => this.probeTcpEndpoint(target.host, target.port, 2000)));
        return results.some((r) => r === true);
    }
    async getHealthState() {
        const snapshot = await this.routerService.pollAndPersistSnapshot();
        const externalReachable = await this.checkExternalInternetReachable();
        const speedTelemetry = await this.speedTestsService.getLatest();
        const routerReachable = snapshot.status !== 'unreachable';
        const wanConnected = snapshot.wanConnected ?? externalReachable;
        const measurementStale = speedTelemetry.isStale;
        let internetHealth = 'healthy';
        if (!externalReachable && !wanConnected) {
            internetHealth = 'offline';
        }
        else if (!routerReachable || measurementStale || !externalReachable) {
            internetHealth = 'degraded';
        }
        const state = {
            internetHealth,
            routerReachable,
            wanConnected,
            externalReachable,
            measurementStale,
            latestSpeedMbps: speedTelemetry.latestSuccessful?.downloadMbps ?? null,
            latencyMs: speedTelemetry.latestSuccessful?.latencyMs ?? null,
            jitterMs: speedTelemetry.latestSuccessful?.jitterMs ?? null,
            checkedAt: new Date().toISOString(),
        };
        return state;
    }
};
exports.NetworkCollectorService = NetworkCollectorService;
exports.NetworkCollectorService = NetworkCollectorService = NetworkCollectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [router_service_1.RouterService,
        speed_tests_service_1.SpeedTestsService,
        realtime_service_1.RealtimeService])
], NetworkCollectorService);
//# sourceMappingURL=network-collector.service.js.map