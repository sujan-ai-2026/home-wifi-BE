import { Controller, Get, Post, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SpeedTestsService } from './speed-tests.service';
import { SpeedTestHistoryQueryDto } from './dto/speed-test-history-query.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('speed-tests')
@Controller('speed-tests')
export class SpeedTestsController {
  constructor(private readonly speedTestsService: SpeedTestsService) {}

  @Public()
  @Get('latest')
  @ApiOperation({ summary: 'Get the latest speed test results and freshness status' })
  @ApiResponse({ status: 200, description: 'Latest speed test telemetry' })
  async getLatest() {
    return this.speedTestsService.getLatest();
  }

  @Public()
  @Get('history')
  @ApiOperation({ summary: 'Get paginated historical speed test measurements' })
  @ApiResponse({ status: 200, description: 'Paginated speed test history' })
  async getHistory(@Query() query: SpeedTestHistoryQueryDto) {
    return this.speedTestsService.getHistory(query);
  }

  @Public()
  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger an immediate on-demand speed test measurement' })
  @ApiResponse({ status: 200, description: 'Speed test completed result' })
  @ApiResponse({ status: 409, description: 'A speed test is already running' })
  async runTest() {
    return this.speedTestsService.runTest();
  }
}
