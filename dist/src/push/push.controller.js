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
exports.PushController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const push_service_1 = require("./push.service");
const push_subscription_dto_1 = require("./dto/push-subscription.dto");
const public_decorator_1 = require("../common/decorators/public.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let PushController = class PushController {
    constructor(pushService) {
        this.pushService = pushService;
    }
    getStatus() {
        return this.pushService.getStatus();
    }
    async subscribe(dto, user) {
        const userId = user?.userId || 'owner';
        return this.pushService.subscribe(userId, dto);
    }
    async unsubscribe(dto) {
        return this.pushService.unsubscribe(dto.endpoint);
    }
};
exports.PushController = PushController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Web Push VAPID configuration status and public key' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Push notification status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PushController.prototype, "getStatus", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('subscribe'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Register a Web Push notification subscription' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription created or updated' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [push_subscription_dto_1.PushSubscriptionDto, Object]),
    __metadata("design:returntype", Promise)
], PushController.prototype, "subscribe", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Delete)('subscribe'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Unsubscribe from Web Push notifications' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription removed' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [push_subscription_dto_1.UnsubscribeDto]),
    __metadata("design:returntype", Promise)
], PushController.prototype, "unsubscribe", null);
exports.PushController = PushController = __decorate([
    (0, swagger_1.ApiTags)('push'),
    (0, common_1.Controller)('push'),
    __metadata("design:paramtypes", [push_service_1.PushService])
], PushController);
//# sourceMappingURL=push.controller.js.map