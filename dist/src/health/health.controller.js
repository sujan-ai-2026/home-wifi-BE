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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pg_1 = require("pg");
const database_provider_1 = require("../database/database.provider");
const public_decorator_1 = require("../common/decorators/public.decorator");
let HealthController = class HealthController {
    constructor(pool) {
        this.pool = pool;
    }
    async check(res) {
        const startTime = Date.now();
        let dbStatus = 'healthy';
        let dbLatencyMs = 0;
        try {
            const dbStart = Date.now();
            await this.pool.query('SELECT 1');
            dbLatencyMs = Date.now() - dbStart;
        }
        catch (err) {
            dbStatus = 'unhealthy';
        }
        const isHealthy = dbStatus === 'healthy';
        const totalLatencyMs = Date.now() - startTime;
        const healthReport = {
            status: isHealthy ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
            dependencies: {
                database: {
                    status: dbStatus,
                    latencyMs: dbLatencyMs,
                },
            },
            latencyMs: totalLatencyMs,
        };
        return res
            .status(isHealthy ? common_1.HttpStatus.OK : common_1.HttpStatus.SERVICE_UNAVAILABLE)
            .json(healthReport);
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Check API and dependency health status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Health check report' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('health'),
    __param(0, (0, common_1.Inject)(database_provider_1.PG_POOL)),
    __metadata("design:paramtypes", [pg_1.Pool])
], HealthController);
//# sourceMappingURL=health.controller.js.map