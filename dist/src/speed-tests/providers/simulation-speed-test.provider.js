"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SimulationSpeedTestProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationSpeedTestProvider = void 0;
const common_1 = require("@nestjs/common");
let SimulationSpeedTestProvider = SimulationSpeedTestProvider_1 = class SimulationSpeedTestProvider {
    constructor() {
        this.name = 'simulation';
        this.logger = new common_1.Logger(SimulationSpeedTestProvider_1.name);
    }
    async execute() {
        this.logger.log('Executing simulated speed test...');
        await new Promise((resolve) => setTimeout(resolve, 800));
        const download = 95 + Math.random() * 15;
        const upload = 90 + Math.random() * 15;
        const latency = 10 + Math.random() * 4;
        const jitter = 1 + Math.random() * 2;
        return {
            status: 'success',
            downloadMbps: parseFloat(download.toFixed(2)),
            uploadMbps: parseFloat(upload.toFixed(2)),
            latencyMs: parseFloat(latency.toFixed(2)),
            jitterMs: parseFloat(jitter.toFixed(2)),
            serverName: 'Airtel Broadband - Local PoP (Simulated)',
            provider: 'simulation',
            measuredAt: new Date(),
        };
    }
};
exports.SimulationSpeedTestProvider = SimulationSpeedTestProvider;
exports.SimulationSpeedTestProvider = SimulationSpeedTestProvider = SimulationSpeedTestProvider_1 = __decorate([
    (0, common_1.Injectable)()
], SimulationSpeedTestProvider);
//# sourceMappingURL=simulation-speed-test.provider.js.map