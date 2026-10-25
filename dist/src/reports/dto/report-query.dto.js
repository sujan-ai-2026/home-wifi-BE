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
exports.DailyReportQueryDto = exports.MonthlyReportQueryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class MonthlyReportQueryDto {
}
exports.MonthlyReportQueryDto = MonthlyReportQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Target month in YYYY-MM format', example: '2026-10' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{4}-(0[1-9]|1[0-2])$/, {
        message: 'month must be in YYYY-MM format',
    }),
    __metadata("design:type", String)
], MonthlyReportQueryDto.prototype, "month", void 0);
class DailyReportQueryDto {
}
exports.DailyReportQueryDto = DailyReportQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target date in YYYY-MM-DD format', example: '2026-10-24' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
        message: 'date must be in YYYY-MM-DD format',
    }),
    __metadata("design:type", String)
], DailyReportQueryDto.prototype, "date", void 0);
//# sourceMappingURL=report-query.dto.js.map