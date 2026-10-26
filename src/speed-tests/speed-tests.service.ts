import {
  Injectable,
  Inject,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { desc, eq, and, gte, lte, count, notLike } from 'drizzle-orm';
import { DRIZZLE_ORM, DrizzleDb } from '../database/database.provider';
import { speedTests } from '../database/schema';
import { CliSpeedTestProvider } from './providers/cli-speed-test.provider';
import { SpeedTestResult } from './providers/speed-test-provider.interface';
import { AlertsService } from '../alerts/alerts.service';
import { RealtimeService } from '../realtime/realtime.service';
import { SettingsService } from '../settings/settings.service';
import { SpeedTestHistoryQueryDto } from './dto/speed-test-history-query.dto';

@Injectable()
export class SpeedTestsService {
  private readonly logger = new Logger(SpeedTestsService.name);
  private isRunning = false;

  constructor(
    @Inject(DRIZZLE_ORM) private readonly db: DrizzleDb,
    private readonly cliProvider: CliSpeedTestProvider,
    private readonly alertsService: AlertsService,
    private readonly realtimeService: RealtimeService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Executes a speed test with single-flight mutex protection
   */
  async runTest(): Promise<SpeedTestResult> {
    if (this.isRunning) {
      throw new ConflictException('A speed test is already in progress');
    }

    this.isRunning = true;
    try {
      const result = await this.cliProvider.execute();

      if (result.provider.toLowerCase().startsWith('simulation')) {
        this.logger.warn('Skipping persistence of simulated speed-test data');
        return {
          ...result,
          status: 'failed',
          downloadMbps: null,
          uploadMbps: null,
          latencyMs: null,
          jitterMs: null,
          errorCode: 'SIMULATION_NOT_PERSISTED',
          errorMessage: 'Simulated speed-test data is not stored.',
        };
      }

      // Persist outcome to database
      const [record] = await this.db
        .insert(speedTests)
        .values({
          downloadMbps: result.downloadMbps !== null ? result.downloadMbps.toFixed(2) : null,
          uploadMbps: result.uploadMbps !== null ? result.uploadMbps.toFixed(2) : null,
          latencyMs: result.latencyMs !== null ? result.latencyMs.toFixed(2) : null,
          jitterMs: result.jitterMs !== null ? result.jitterMs.toFixed(2) : null,
          serverName: result.serverName,
          provider: result.provider,
          status: result.status,
          errorCode: result.errorCode ?? null,
          errorMessage: result.errorMessage ?? null,
          measuredAt: result.measuredAt,
        })
        .returning();

      // If test succeeded, evaluate against alert threshold policies
      if (
        result.status === 'success' &&
        result.downloadMbps !== null &&
        result.uploadMbps !== null
      ) {
        await this.alertsService.evaluateMeasurement(
          result.downloadMbps,
          result.uploadMbps,
          result.measuredAt,
        );
      }

      // Broadcast WebSocket update
      this.realtimeService.emitSpeedTest({
        id: record.id,
        downloadMbps: result.downloadMbps,
        uploadMbps: result.uploadMbps,
        latencyMs: result.latencyMs,
        jitterMs: result.jitterMs,
        status: result.status,
        measuredAt: result.measuredAt.toISOString(),
      });

      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Retrieves the latest successful test and attempt with staleness tracking
   */
  async getLatest() {
    const [latestAttempt] = await this.db
      .select()
      .from(speedTests)
      .where(notLike(speedTests.provider, 'simulation%'))
      .orderBy(desc(speedTests.measuredAt))
      .limit(1);

    const [latestSuccess] = await this.db
      .select()
      .from(speedTests)
      .where(
        and(
          eq(speedTests.status, 'success'),
          notLike(speedTests.provider, 'simulation%'),
        ),
      )
      .orderBy(desc(speedTests.measuredAt))
      .limit(1);

    const settings = await this.settingsService.getSettings();
    const staleThresholdMs = settings.speedTestIntervalMinutes * 2 * 60 * 1000;

    let isStale = false;
    let freshnessSeconds: number | null = null;

    if (latestSuccess) {
      const ageMs = Date.now() - new Date(latestSuccess.measuredAt).getTime();
      freshnessSeconds = Math.floor(ageMs / 1000);
      isStale = ageMs > staleThresholdMs;
    } else {
      isStale = true;
    }

    return {
      latestSuccessful: latestSuccess
        ? {
            id: latestSuccess.id,
            downloadMbps: latestSuccess.downloadMbps ? parseFloat(latestSuccess.downloadMbps) : null,
            uploadMbps: latestSuccess.uploadMbps ? parseFloat(latestSuccess.uploadMbps) : null,
            latencyMs: latestSuccess.latencyMs ? parseFloat(latestSuccess.latencyMs) : null,
            jitterMs: latestSuccess.jitterMs ? parseFloat(latestSuccess.jitterMs) : null,
            serverName: latestSuccess.serverName,
            provider: latestSuccess.provider,
            measuredAt: latestSuccess.measuredAt.toISOString(),
          }
        : null,
      latestAttempt: latestAttempt
        ? {
            id: latestAttempt.id,
            status: latestAttempt.status,
            errorCode: latestAttempt.errorCode,
            errorMessage: latestAttempt.errorMessage,
            measuredAt: latestAttempt.measuredAt.toISOString(),
          }
        : null,
      isStale,
      freshnessSeconds,
    };
  }

  /**
   * Paginated speed-test measurement history
   */
  async getHistory(query: SpeedTestHistoryQueryDto) {
    const conditions: any[] = [notLike(speedTests.provider, 'simulation%')];

    if (query.status) {
      conditions.push(eq(speedTests.status, query.status));
    }
    if (query.from) {
      conditions.push(gte(speedTests.measuredAt, new Date(query.from)));
    }
    if (query.to) {
      conditions.push(lte(speedTests.measuredAt, new Date(query.to)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(speedTests)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const rows = await this.db
      .select()
      .from(speedTests)
      .where(whereClause)
      .orderBy(desc(speedTests.measuredAt))
      .limit(query.limit)
      .offset(query.offset);

    const items = rows.map((r) => ({
      id: r.id,
      downloadMbps: r.downloadMbps ? parseFloat(r.downloadMbps) : null,
      uploadMbps: r.uploadMbps ? parseFloat(r.uploadMbps) : null,
      latencyMs: r.latencyMs ? parseFloat(r.latencyMs) : null,
      jitterMs: r.jitterMs ? parseFloat(r.jitterMs) : null,
      serverName: r.serverName,
      provider: r.provider,
      status: r.status,
      errorCode: r.errorCode,
      errorMessage: r.errorMessage,
      measuredAt: r.measuredAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems: total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }
}
