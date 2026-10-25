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
exports.SpeedTestsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const speed_tests_service_1 = require("./speed-tests.service");
const speed_test_history_query_dto_1 = require("./dto/speed-test-history-query.dto");
const public_decorator_1 = require("../common/decorators/public.decorator");
let SpeedTestsController = class SpeedTestsController {
    constructor(speedTestsService) {
        this.speedTestsService = speedTestsService;
    }
    async getLatest() {
        return this.speedTestsService.getLatest();
    }
    async getHistory(query) {
        return this.speedTestsService.getHistory(query);
    }
    async runTest() {
        return this.speedTestsService.runTest();
    }
};
exports.SpeedTestsController = SpeedTestsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('latest'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the latest speed test results and freshness status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Latest speed test telemetry' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SpeedTestsController.prototype, "getLatest", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated historical speed test measurements' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated speed test history' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [speed_test_history_query_dto_1.SpeedTestHistoryQueryDto]),
    __metadata("design:returntype", Promise)
], SpeedTestsController.prototype, "getHistory", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('run'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger an immediate on-demand speed test measurement' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Speed test completed result' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'A speed test is already running' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SpeedTestsController.prototype, "runTest", null);
exports.SpeedTestsController = SpeedTestsController = __decorate([
    (0, swagger_1.ApiTags)('speed-tests'),
    (0, common_1.Controller)('speed-tests'),
    __metadata("design:paramtypes", [speed_tests_service_1.SpeedTestsService])
], SpeedTestsController);
//# sourceMappingURL=speed-tests.controller.js.map