import { IsNotEmpty, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MonthlyReportQueryDto {
  @ApiPropertyOptional({ description: 'Target month in YYYY-MM format', example: '2026-10' })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format',
  })
  month?: string;
}

export class DailyReportQueryDto {
  @ApiProperty({ description: 'Target date in YYYY-MM-DD format', example: '2026-10-24' })
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date!: string;
}
