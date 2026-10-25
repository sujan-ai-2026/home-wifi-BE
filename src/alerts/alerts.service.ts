import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { DRIZZLE_ORM, DrizzleDb } from '../database/database.provider';
import { alertEvents, notificationDeliveries } from '../database/schema';
import { SettingsService } from '../settings/settings.service';
import { PushService } from '../push/push.service';
import { RealtimeService } from '../realtime/realtime.service';
import { AlertsQueryDto } from './dto/alerts-query.dto';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  // In-memory counters for consecutive breaches and recoveries
  private consecutiveBreaches = {
    download: 0,
    upload: 0,
  };

  private consecutiveRecoveries = {
    download: 0,
    upload: 0,
  };

  constructor(
    @Inject(DRIZZLE_ORM) private readonly db: DrizzleDb,
    private readonly settingsService: SettingsService,
    private readonly pushService: PushService,
    private readonly realtimeService: RealtimeService,
  ) {}

  /**
   * Evaluates a successful speed measurement against configured thresholds
   */
  async evaluateMeasurement(
    downloadMbps: number,
    uploadMbps: number,
    measuredAt: Date,
  ) {
    const settings = await this.settingsService.getSettings();

    await this.evaluateMetric({
      metric: 'download',
      measuredValue: downloadMbps,
      thresholdValue: settings.downloadThresholdMbps,
      recoveryThresholdValue: settings.recoveryThresholdMbps,
      consecutiveRequired: settings.consecutiveBreachesRequired,
      recoveryRequired: settings.recoverySamplesRequired,
      measuredAt,
    });

    await this.evaluateMetric({
      metric: 'upload',
      measuredValue: uploadMbps,
      thresholdValue: settings.uploadThresholdMbps,
      recoveryThresholdValue: settings.recoveryThresholdMbps,
      consecutiveRequired: settings.consecutiveBreachesRequired,
      recoveryRequired: settings.recoverySamplesRequired,
      measuredAt,
    });
  }

  private async evaluateMetric(params: {
    metric: 'download' | 'upload';
    measuredValue: number;
    thresholdValue: number;
    recoveryThresholdValue: number;
    consecutiveRequired: number;
    recoveryRequired: number;
    measuredAt: Date;
  }) {
    const {
      metric,
      measuredValue,
      thresholdValue,
      recoveryThresholdValue,
      consecutiveRequired,
      recoveryRequired,
      measuredAt,
    } = params;

    const activeIncidentKey = `low_speed_${metric}_active`;

    // Check for existing active incident
    const [activeIncident] = await this.db
      .select()
      .from(alertEvents)
      .where(
        and(
          eq(alertEvents.incidentKey, activeIncidentKey),
          eq(alertEvents.status, 'active'),
        ),
      )
      .limit(1);

    if (measuredValue < thresholdValue) {
      // Breach branch
      this.consecutiveBreaches[metric]++;
      this.consecutiveRecoveries[metric] = 0;

      this.logger.warn(
        `${metric.toUpperCase()} speed breach: ${measuredValue} Mbps < ${thresholdValue} Mbps (consecutive: ${this.consecutiveBreaches[metric]}/${consecutiveRequired})`,
      );

      if (this.consecutiveBreaches[metric] >= consecutiveRequired) {
        if (!activeIncident) {
          // Create new incident atomically
          const severity = measuredValue < thresholdValue / 2 ? 'critical' : 'warning';
          const [newIncident] = await this.db
            .insert(alertEvents)
            .values({
              incidentKey: activeIncidentKey,
              metric,
              measuredValue: measuredValue.toFixed(2),
              thresholdValue: thresholdValue.toFixed(2),
              severity,
              status: 'active',
              startedAt: measuredAt,
              lastBreachAt: measuredAt,
            })
            .returning();

          this.logger.log(`Created new low-speed incident: ${newIncident.id} (${metric})`);

          // Trigger WebSocket event
          this.realtimeService.emitAlertCreated({
            id: newIncident.id,
            incidentKey: newIncident.incidentKey,
            metric: newIncident.metric,
            measuredValue: parseFloat(newIncident.measuredValue),
            thresholdValue: parseFloat(newIncident.thresholdValue),
            severity: newIncident.severity,
            status: newIncident.status,
            startedAt: newIncident.startedAt.toISOString(),
          });

          // Trigger Web Push delivery asynchronously without blocking
          this.pushService.sendAlertNotifications(newIncident).catch((err) => {
            this.logger.error(`Push delivery error: ${err.message}`);
          });
        } else {
          // Update existing incident lastBreachAt
          await this.db
            .update(alertEvents)
            .set({
              lastBreachAt: measuredAt,
              measuredValue: measuredValue.toFixed(2),
              updatedAt: new Date(),
            })
            .where(eq(alertEvents.id, activeIncident.id));
        }
      }
    } else if (measuredValue >= recoveryThresholdValue) {
      // Recovery branch
      this.consecutiveRecoveries[metric]++;
      this.consecutiveBreaches[metric] = 0;

      if (
        activeIncident &&
        this.consecutiveRecoveries[metric] >= recoveryRequired
      ) {
        this.logger.log(
          `${metric.toUpperCase()} recovered: ${measuredValue} Mbps >= ${recoveryThresholdValue} Mbps. Resolving incident ${activeIncident.id}`,
        );

        const resolvedKey = `low_speed_${metric}_resolved_${activeIncident.id}`;
        const [resolved] = await this.db
          .update(alertEvents)
          .set({
            status: 'resolved',
            resolvedAt: measuredAt,
            incidentKey: resolvedKey,
            updatedAt: new Date(),
          })
          .where(eq(alertEvents.id, activeIncident.id))
          .returning();

        this.realtimeService.emitAlertResolved({
          id: resolved.id,
          incidentKey: resolved.incidentKey,
          metric: resolved.metric,
          measuredValue: parseFloat(resolved.measuredValue),
          thresholdValue: parseFloat(resolved.thresholdValue),
          severity: resolved.severity,
          status: resolved.status,
          startedAt: resolved.startedAt.toISOString(),
          resolvedAt: resolved.resolvedAt?.toISOString() || null,
        });
      }
    } else {
      // Value is between breach threshold and recovery threshold - hold current state
      this.consecutiveBreaches[metric] = 0;
      this.consecutiveRecoveries[metric] = 0;
    }
  }

  async listAlerts(query: AlertsQueryDto) {
    const conditions: any[] = [];

    if (query.status) {
      conditions.push(eq(alertEvents.status, query.status));
    }
    if (query.metric) {
      conditions.push(eq(alertEvents.metric, query.metric));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(alertEvents)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const items = await this.db
      .select()
      .from(alertEvents)
      .where(whereClause)
      .orderBy(desc(alertEvents.startedAt))
      .limit(query.limit)
      .offset(query.offset);

    return {
      items: items.map((a) => {
        let title = `${a.metric.toUpperCase()} speed below threshold`;
        let detail = `Measured ${a.measuredValue} Mbps (threshold: ${a.thresholdValue} Mbps)`;
        if (a.metric === 'device_connected') {
          title = 'New Device Connected';
          detail = a.incidentKey.includes('::') ? a.incidentKey.split('::')[1] : 'Device joined the network';
        } else if (a.metric === 'device_disconnected') {
          title = 'Device Disconnected';
          detail = a.incidentKey.includes('::') ? a.incidentKey.split('::')[1] : 'Device left the network';
        }
        return {
          ...a,
          measuredValue: parseFloat(a.measuredValue),
          thresholdValue: parseFloat(a.thresholdValue),
          title,
          detail,
          timestamp: a.startedAt.toISOString(),
          acknowledged: a.status === 'resolved',
        };
      }),
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems: total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  /**
   * Purges alerts older than 2 days to save DB space
   */
  async purgeOldAlerts() {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const result = await this.db
      .delete(alertEvents)
      .where(sql`${alertEvents.createdAt} < ${twoDaysAgo}`);

    this.logger.log(`Purged old alerts from database`);
    return result;
  }

  async getAlertById(id: string) {
    const [alert] = await this.db
      .select()
      .from(alertEvents)
      .where(eq(alertEvents.id, id))
      .limit(1);

    if (!alert) {
      throw new NotFoundException(`Alert incident with ID ${id} not found`);
    }

    const deliveries = await this.db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.alertEventId, id));

    return {
      ...alert,
      measuredValue: parseFloat(alert.measuredValue),
      thresholdValue: parseFloat(alert.thresholdValue),
      notificationDeliveries: deliveries,
    };
  }

  async getActiveIncidentCount(): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(alertEvents)
      .where(eq(alertEvents.status, 'active'));

    return Number(result?.count || 0);
  }
}
