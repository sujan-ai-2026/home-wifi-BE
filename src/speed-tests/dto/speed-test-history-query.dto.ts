import { IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class SpeedTestHistoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter measurements from ISO date', example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Filter measurements to ISO date', example: '2026-01-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ enum: ['success', 'failed'] })
  @IsOptional()
  @IsIn(['success', 'failed'])
  status?: 'success' | 'failed';
}
