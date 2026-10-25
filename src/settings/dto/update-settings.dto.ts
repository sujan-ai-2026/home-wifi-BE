import { IsOptional, IsNumber, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(10000)
  downloadThresholdMbps?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(10000)
  uploadThresholdMbps?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  consecutiveBreachesRequired?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(10000)
  recoveryThresholdMbps?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  recoverySamplesRequired?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  speedTestIntervalMinutes?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(3600)
  routerPollIntervalSeconds?: number;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(3650)
  retentionDays?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(10000)
  speedThresholdMbps?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(3600)
  monitoringIntervalSeconds?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  notificationsEnabled?: boolean;
}
