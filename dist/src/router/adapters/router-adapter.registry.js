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
var RouterAdapterRegistry_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterAdapterRegistry = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mock_adapter_1 = require("./mock.adapter");
const airtel_adapter_1 = require("./airtel.adapter");
let RouterAdapterRegistry = RouterAdapterRegistry_1 = class RouterAdapterRegistry {
    constructor(configService, mockAdapter, airtelAdapter) {
        this.configService = configService;
        this.mockAdapter = mockAdapter;
        this.airtelAdapter = airtelAdapter;
        this.logger = new common_1.Logger(RouterAdapterRegistry_1.name);
        this.adapters = new Map();
        this.register(this.mockAdapter);
        this.register(this.airtelAdapter);
    }
    register(adapter) {
        this.adapters.set(adapter.name.toLowerCase(), adapter);
    }
    getActiveAdapter() {
        const configuredName = (this.configService.get('app.routerAdapter') || 'mock').toLowerCase();
        const adapter = this.adapters.get(configuredName);
        if (!adapter) {
            this.logger.warn(`Configured router adapter '${configuredName}' not found. Falling back to 'mock'.`);
            return this.mockAdapter;
        }
        return adapter;
    }
};
exports.RouterAdapterRegistry = RouterAdapterRegistry;
exports.RouterAdapterRegistry = RouterAdapterRegistry = RouterAdapterRegistry_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mock_adapter_1.MockRouterAdapter,
        airtel_adapter_1.AirtelRouterAdapter])
], RouterAdapterRegistry);
//# sourceMappingURL=router-adapter.registry.js.map