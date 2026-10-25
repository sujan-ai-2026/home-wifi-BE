import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { AlertsQueryDto } from './dto/alerts-query.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List low-speed incidents and alerts' })
  @ApiResponse({ status: 200, description: 'Paginated alert incidents' })
  async getAlerts(@Query() query: AlertsQueryDto) {
    return this.alertsService.listAlerts(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get details and notification logs for a specific alert' })
  @ApiResponse({ status: 200, description: 'Alert event details with deliveries' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async getAlertById(@Param('id') id: string) {
    return this.alertsService.getAlertById(id);
  }
}
