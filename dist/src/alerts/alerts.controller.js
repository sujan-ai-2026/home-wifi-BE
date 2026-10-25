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
exports.AlertsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const alerts_service_1 = require("./alerts.service");
const alerts_query_dto_1 = require("./dto/alerts-query.dto");
const public_decorator_1 = require("../common/decorators/public.decorator");
let AlertsController = class AlertsController {
    constructor(alertsService) {
        this.alertsService = alertsService;
    }
    async getAlerts(query) {
        return this.alertsService.listAlerts(query);
    }
    async getAlertById(id) {
        return this.alertsService.getAlertById(id);
    }
};
exports.AlertsController = AlertsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List low-speed incidents and alerts' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated alert incidents' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [alerts_query_dto_1.AlertsQueryDto]),
    __metadata("design:returntype", Promise)
], AlertsController.prototype, "getAlerts", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get details and notification logs for a specific alert' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Alert event details with deliveries' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Alert not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AlertsController.prototype, "getAlertById", null);
exports.AlertsController = AlertsController = __decorate([
    (0, swagger_1.ApiTags)('alerts'),
    (0, common_1.Controller)('alerts'),
    __metadata("design:paramtypes", [alerts_service_1.AlertsService])
], AlertsController);
//# sourceMappingURL=alerts.controller.js.map