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
exports.DevicesQueryDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
class DevicesQueryDto extends pagination_dto_1.PaginationQueryDto {
}
exports.DevicesQueryDto = DevicesQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by hostname or IP address' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DevicesQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by online status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DevicesQueryDto.prototype, "isOnline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by connection type' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['wifi', 'ethernet', 'unknown']),
    __metadata("design:type", String)
], DevicesQueryDto.prototype, "connectionType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by device type' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DevicesQueryDto.prototype, "deviceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter from date (ISO string)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DevicesQueryDto.prototype, "fromDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter to date (ISO string)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DevicesQueryDto.prototype, "toDate", void 0);
//# sourceMappingURL=devices-query.dto.js.map