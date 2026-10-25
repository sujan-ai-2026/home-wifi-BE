"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const core_1 = require("@nestjs/core");
const app_config_1 = require("./config/app.config");
const env_validation_1 = require("./config/env.validation");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./auth/auth.module");
const realtime_module_1 = require("./realtime/realtime.module");
const router_module_1 = require("./router/router.module");
const settings_module_1 = require("./settings/settings.module");
const alerts_module_1 = require("./alerts/alerts.module");
const push_module_1 = require("./push/push.module");
const devices_module_1 = require("./devices/devices.module");
const speed_tests_module_1 = require("./speed-tests/speed-tests.module");
const network_collector_module_1 = require("./network-collector/network-collector.module");
const reports_module_1 = require("./reports/reports.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const health_module_1 = require("./health/health.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const correlation_id_interceptor_1 = require("./common/interceptors/correlation-id.interceptor");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default],
                validate: env_validation_1.validateEnv,
            }),
            schedule_1.ScheduleModule.forRoot(),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            realtime_module_1.RealtimeModule,
            router_module_1.RouterModule,
            settings_module_1.SettingsModule,
            alerts_module_1.AlertsModule,
            push_module_1.PushModule,
            devices_module_1.DevicesModule,
            speed_tests_module_1.SpeedTestsModule,
            network_collector_module_1.NetworkCollectorModule,
            reports_module_1.ReportsModule,
            dashboard_module_1.DashboardModule,
            health_module_1.HealthModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: correlation_id_interceptor_1.CorrelationIdInterceptor,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: all_exceptions_filter_1.AllExceptionsFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map