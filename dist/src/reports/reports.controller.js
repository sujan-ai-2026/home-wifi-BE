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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const report_query_dto_1 = require("./dto/report-query.dto");
const public_decorator_1 = require("../common/decorators/public.decorator");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getMonthlyReport(query) {
        const month = query.month || new Date().toISOString().slice(0, 7);
        return this.reportsService.getMonthlyReport(month);
    }
    async getDailyReport(query) {
        return this.reportsService.getDailyReport(query.date);
    }
    async exportCsv(query, res) {
        const month = query.month || new Date().toISOString().slice(0, 7);
        const csvData = await this.reportsService.exportMonthlyCsv(month);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="homenet-speedtests-${month}.csv"`);
        res.status(common_1.HttpStatus.OK).send(csvData);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('monthly'),
    (0, swagger_1.ApiOperation)({ summary: 'Get aggregated network speed and stability report for a month' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Monthly report summary' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_query_dto_1.MonthlyReportQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getMonthlyReport", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('daily'),
    (0, swagger_1.ApiOperation)({ summary: 'Get daily speed test metrics for a given date' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Daily summary metrics' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_query_dto_1.DailyReportQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getDailyReport", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('export'),
    (0, swagger_1.ApiOperation)({ summary: 'Export speed tests measurements for a month as CSV' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'CSV file download' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_query_dto_1.MonthlyReportQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportCsv", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map