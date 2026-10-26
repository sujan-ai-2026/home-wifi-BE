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
var RouterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_provider_1 = require("../database/database.provider");
const schema_1 = require("../database/schema");
const router_adapter_registry_1 = require("./adapters/router-adapter.registry");
let RouterService = RouterService_1 = class RouterService {
    constructor(db, registry) {
        this.db = db;
        this.registry = registry;
        this.logger = new common_1.Logger(RouterService_1.name);
    }
    async pollAndPersistSnapshot() {
        const adapter = this.registry.getActiveAdapter();
        const status = await adapter.getStatus();
        const counters = await adapter.getInterfaceCounters();
        if (status.source.toLowerCase().startsWith('mock') ||
            status.source === 'airtel_gateway' ||
            counters?.source.toLowerCase().startsWith('mock')) {
            this.logger.warn('Skipping persistence of mock router snapshot data');
            return status;
        }
        try {
            await this.db.insert(schema_1.routerSnapshots).values({
                wanConnected: status.wanConnected,
                routerUptimeSeconds: status.routerUptimeSeconds,
                receivedBytes: counters?.receivedBytes ?? null,
                transmittedBytes: counters?.transmittedBytes ?? null,
                source: status.source,
                status: status.status,
                observedAt: new Date(),
            });
        }
        catch (err) {
            this.logger.error(`Failed to persist router snapshot: ${err.message}`);
        }
        return status;
    }
    async getLatestSnapshot() {
        const [latest] = await this.db
            .select()
            .from(schema_1.routerSnapshots)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.notLike)(schema_1.routerSnapshots.source, 'mock%'), (0, drizzle_orm_1.notInArray)(schema_1.routerSnapshots.source, ['airtel_gateway', 'airtel_counters'])))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.routerSnapshots.observedAt))
            .limit(1);
        return latest || null;
    }
    async getConnectedDevices() {
        const adapter = this.registry.getActiveAdapter();
        return adapter.getConnectedDevices();
    }
};
exports.RouterService = RouterService;
exports.RouterService = RouterService = RouterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_provider_1.DRIZZLE_ORM)),
    __metadata("design:paramtypes", [Object, router_adapter_registry_1.RouterAdapterRegistry])
], RouterService);
//# sourceMappingURL=router.service.js.map