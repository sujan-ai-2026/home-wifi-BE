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
exports.DevicesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const devices_service_1 = require("./devices.service");
const devices_query_dto_1 = require("./dto/devices-query.dto");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const public_decorator_1 = require("../common/decorators/public.decorator");
const router_service_1 = require("../router/router.service");
let DevicesController = class DevicesController {
    constructor(devicesService, routerService) {
        this.devicesService = devicesService;
        this.routerService = routerService;
    }
    async getLiveDevices() {
        const devices = (await this.routerService.getConnectedDevices()).filter((device) => !device.source.toLowerCase().startsWith('mock') &&
            device.source.toLowerCase() !== 'airtel_gateway');
        return {
            items: devices,
            meta: {
                totalConnected: devices.filter((device) => device.isOnline).length,
                updatedAt: new Date().toISOString(),
            },
        };
    }
    async getDevices(query) {
        return this.devicesService.listDevices(query);
    }
    async getDeviceById(id) {
        return this.devicesService.getDeviceById(id);
    }
    async getDeviceHistory(id, pagination) {
        return this.devicesService.getDeviceHistory(id, pagination);
    }
    async clearOfflineDevices() {
        return this.devicesService.clearOfflineDevices();
    }
};
exports.DevicesController = DevicesController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('live'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current devices from the active router adapter' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Live router-discovered devices' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "getLiveDevices", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List connected and historical home network devices' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated devices list' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [devices_query_dto_1.DevicesQueryDto]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "getDevices", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get details for a specific device' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Device details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Device not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "getDeviceById", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get online/offline observation history for a device' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Device observation history' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "getDeviceHistory", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Delete)('offline'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove all offline devices from database' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Offline devices cleared (or none found)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "clearOfflineDevices", null);
exports.DevicesController = DevicesController = __decorate([
    (0, swagger_1.ApiTags)('devices'),
    (0, common_1.Controller)('devices'),
    __metadata("design:paramtypes", [devices_service_1.DevicesService,
        router_service_1.RouterService])
], DevicesController);
//# sourceMappingURL=devices.controller.js.map