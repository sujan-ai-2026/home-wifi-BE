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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertsQueryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
class AlertsQueryDto extends pagination_dto_1.PaginationQueryDto {
}
exports.AlertsQueryDto = AlertsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['active', 'resolved', 'pending', 'delivery_failed'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'resolved', 'pending', 'delivery_failed']),
    __metadata("design:type", String)
], AlertsQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['download', 'upload', 'device_connected', 'device_disconnected'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['download', 'upload', 'device_connected', 'device_disconnected']),
    __metadata("design:type", String)
], AlertsQueryDto.prototype, "metric", void 0);
//# sourceMappingURL=alerts-query.dto.js.map