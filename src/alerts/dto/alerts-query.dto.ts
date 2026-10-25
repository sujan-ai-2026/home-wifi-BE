import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class AlertsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['active', 'resolved', 'pending', 'delivery_failed'] })
  @IsOptional()
  @IsIn(['active', 'resolved', 'pending', 'delivery_failed'])
  status?: string;

  @ApiPropertyOptional({ enum: ['download', 'upload', 'device_connected', 'device_disconnected'] })
  @IsOptional()
  @IsIn(['download', 'upload', 'device_connected', 'device_disconnected'])
  metric?: string;
}
