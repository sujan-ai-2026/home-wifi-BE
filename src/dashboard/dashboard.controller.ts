import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Public()
  @Get('overview')
  @ApiOperation({ summary: 'Get aggregated dashboard overview telemetry and health metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard overview metrics' })
  async getOverview() {
    return this.dashboardService.getOverview();
  }
}
