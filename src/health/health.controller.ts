import { Controller, Get, Inject, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.provider';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check API and dependency health status' })
  @ApiResponse({ status: 200, description: 'Health check report' })
  async check(@Res() res: Response) {
    const startTime = Date.now();
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;

    try {
      const dbStart = Date.now();
      await this.pool.query('SELECT 1');
      dbLatencyMs = Date.now() - dbStart;
    } catch (err: any) {
      dbStatus = 'unhealthy';
    }

    const isHealthy = dbStatus === 'healthy';
    const totalLatencyMs = Date.now() - startTime;

    const healthReport = {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      dependencies: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
      latencyMs: totalLatencyMs,
    };

    return res
      .status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
      .json(healthReport);
  }
}
