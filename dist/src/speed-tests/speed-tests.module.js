"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeedTestsModule = void 0;
const common_1 = require("@nestjs/common");
const speed_tests_controller_1 = require("./speed-tests.controller");
const speed_tests_service_1 = require("./speed-tests.service");
const speed_test_scheduler_1 = require("./speed-test.scheduler");
const cli_speed_test_provider_1 = require("./providers/cli-speed-test.provider");
const simulation_speed_test_provider_1 = require("./providers/simulation-speed-test.provider");
let SpeedTestsModule = class SpeedTestsModule {
};
exports.SpeedTestsModule = SpeedTestsModule;
exports.SpeedTestsModule = SpeedTestsModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [speed_tests_controller_1.SpeedTestsController],
        providers: [
            simulation_speed_test_provider_1.SimulationSpeedTestProvider,
            cli_speed_test_provider_1.CliSpeedTestProvider,
            speed_tests_service_1.SpeedTestsService,
            speed_test_scheduler_1.SpeedTestScheduler,
        ],
        exports: [speed_tests_service_1.SpeedTestsService],
    })
], SpeedTestsModule);
//# sourceMappingURL=speed-tests.module.js.map