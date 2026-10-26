"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterModule = void 0;
const common_1 = require("@nestjs/common");
const mock_adapter_1 = require("./adapters/mock.adapter");
const airtel_adapter_1 = require("./adapters/airtel.adapter");
const unsupported_adapter_1 = require("./adapters/unsupported.adapter");
const router_adapter_registry_1 = require("./adapters/router-adapter.registry");
const router_service_1 = require("./router.service");
let RouterModule = class RouterModule {
};
exports.RouterModule = RouterModule;
exports.RouterModule = RouterModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            mock_adapter_1.MockRouterAdapter,
            airtel_adapter_1.AirtelRouterAdapter,
            unsupported_adapter_1.UnsupportedRouterAdapter,
            router_adapter_registry_1.RouterAdapterRegistry,
            router_service_1.RouterService,
        ],
        exports: [router_service_1.RouterService, router_adapter_registry_1.RouterAdapterRegistry],
    })
], RouterModule);
//# sourceMappingURL=router.module.js.map