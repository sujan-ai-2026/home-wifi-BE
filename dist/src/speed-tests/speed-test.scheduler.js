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
var SpeedTestScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeedTestScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const speed_tests_service_1 = require("./speed-tests.service");
let SpeedTestScheduler = SpeedTestScheduler_1 = class SpeedTestScheduler {
    constructor(speedTestsService) {
        this.speedTestsService = speedTestsService;
        this.logger = new common_1.Logger(SpeedTestScheduler_1.name);
    }
    async handleScheduledSpeedTest() {
        this.logger.log('Triggering scheduled internet speed test...');
        try {
            await this.speedTestsService.runTest();
            this.logger.log('Scheduled internet speed test completed successfully.');
        }
        catch (err) {
            this.logger.warn(`Scheduled speed test did not complete: ${err.message}`);
        }
    }
};
exports.SpeedTestScheduler = SpeedTestScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SpeedTestScheduler.prototype, "handleScheduledSpeedTest", null);
exports.SpeedTestScheduler = SpeedTestScheduler = SpeedTestScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [speed_tests_service_1.SpeedTestsService])
], SpeedTestScheduler);
//# sourceMappingURL=speed-test.scheduler.js.map