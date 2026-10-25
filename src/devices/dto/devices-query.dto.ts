import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { Type } from 'class-transformer';

export class DevicesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by hostname or IP address' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by online status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({ description: 'Filter by connection type' })
  @IsOptional()
  @IsIn(['wifi', 'ethernet', 'unknown'])
  connectionType?: 'wifi' | 'ethernet' | 'unknown';

  @ApiPropertyOptional({ description: 'Filter by device type' })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({ description: 'Filter from date (ISO string)' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO string)' })
  @IsOptional()
  @IsString()
  toDate?: string;
}
