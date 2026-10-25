import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { MonthlyReportQueryDto, DailyReportQueryDto } from './dto/report-query.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Public()
  @Get('monthly')
  @ApiOperation({ summary: 'Get aggregated network speed and stability report for a month' })
  @ApiResponse({ status: 200, description: 'Monthly report summary' })
  async getMonthlyReport(@Query() query: MonthlyReportQueryDto) {
    const month = query.month || new Date().toISOString().slice(0, 7);
    return this.reportsService.getMonthlyReport(month);
  }

  @Public()
  @Get('daily')
  @ApiOperation({ summary: 'Get daily speed test metrics for a given date' })
  @ApiResponse({ status: 200, description: 'Daily summary metrics' })
  async getDailyReport(@Query() query: DailyReportQueryDto) {
    return this.reportsService.getDailyReport(query.date);
  }

  @Public()
  @Get('export')
  @ApiOperation({ summary: 'Export speed tests measurements for a month as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  async exportCsv(@Query() query: MonthlyReportQueryDto, @Res() res: Response) {
    const month = query.month || new Date().toISOString().slice(0, 7);
    const csvData = await this.reportsService.exportMonthlyCsv(month);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="homenet-speedtests-${month}.csv"`,
    );
    res.status(HttpStatus.OK).send(csvData);
  }
}
