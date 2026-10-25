import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_ORM, DrizzleDb } from '../database/database.provider';
import { appSettings } from '../database/schema';
import { UpdateSettingsDto } from './dto/update-settings.dto';

export interface AppSettingsResponse {
  id: number;
  downloadThresholdMbps: number;
  uploadThresholdMbps: number;
  consecutiveBreachesRequired: number;
  recoveryThresholdMbps: number;
  recoverySamplesRequired: number;
  speedTestIntervalMinutes: number;
  routerPollIntervalSeconds: number;
  timezone: string;
  retentionDays: number;
  updatedAt: string;
  routerName?: string;
  routerStatus?: string;
  monitoringIntervalSeconds?: number;
  speedThresholdMbps?: number;
  notificationsEnabled?: boolean;
}

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(@Inject(DRIZZLE_ORM) private readonly db: DrizzleDb) {}

  async onModuleInit() {
    await this.ensureSettingsRow();
  }

  async ensureSettingsRow() {
    try {
      const existing = await this.db.select().from(appSettings).where(eq(appSettings.id, 1)).limit(1);
      if (existing.length === 0) {
        await this.db.insert(appSettings).values({
          id: 1,
          downloadThresholdMbps: '10.00',
          uploadThresholdMbps: '10.00',
          consecutiveBreachesRequired: 2,
          recoveryThresholdMbps: '12.00',
          recoverySamplesRequired: 1,
          speedTestIntervalMinutes: 15,
          routerPollIntervalSeconds: 60,
          timezone: 'Asia/Kolkata',
          retentionDays: 90,
          notificationsEnabled: true,
        });
        this.logger.log('Default application settings initialized');
      }
    } catch (err: any) {
      this.logger.error(`Error ensuring default app settings: ${err.message}`);
    }
  }

  async getSettings(): Promise<AppSettingsResponse> {
    const [row] = await this.db.select().from(appSettings).where(eq(appSettings.id, 1)).limit(1);
    if (!row) {
      await this.ensureSettingsRow();
      return this.getSettings();
    }
    return {
      id: row.id,
      downloadThresholdMbps: parseFloat(row.downloadThresholdMbps),
      uploadThresholdMbps: parseFloat(row.uploadThresholdMbps),
      consecutiveBreachesRequired: row.consecutiveBreachesRequired,
      recoveryThresholdMbps: parseFloat(row.recoveryThresholdMbps),
      recoverySamplesRequired: row.recoverySamplesRequired,
      speedTestIntervalMinutes: row.speedTestIntervalMinutes,
      routerPollIntervalSeconds: row.routerPollIntervalSeconds,
      timezone: row.timezone,
      retentionDays: row.retentionDays,
      updatedAt: row.updatedAt.toISOString(),
      // Frontend dashboard compatibility
      routerName: 'HomeNet Gateway / Airtel Xstream Fiber',
      routerStatus: 'connected',
      monitoringIntervalSeconds: row.routerPollIntervalSeconds,
      speedThresholdMbps: parseFloat(row.downloadThresholdMbps),
      notificationsEnabled: row.notificationsEnabled ?? true,
    };
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<any> {
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    const dlThreshold = dto.downloadThresholdMbps ?? dto.speedThresholdMbps;
    if (dlThreshold !== undefined) {
      updateData.downloadThresholdMbps = dlThreshold.toFixed(2);
    }
    if (dto.uploadThresholdMbps !== undefined) {
      updateData.uploadThresholdMbps = dto.uploadThresholdMbps.toFixed(2);
    }
    if (dto.consecutiveBreachesRequired !== undefined) {
      updateData.consecutiveBreachesRequired = dto.consecutiveBreachesRequired;
    }
    if (dto.recoveryThresholdMbps !== undefined) {
      updateData.recoveryThresholdMbps = dto.recoveryThresholdMbps.toFixed(2);
    }
    if (dto.recoverySamplesRequired !== undefined) {
      updateData.recoverySamplesRequired = dto.recoverySamplesRequired;
    }
    if (dto.speedTestIntervalMinutes !== undefined) {
      updateData.speedTestIntervalMinutes = dto.speedTestIntervalMinutes;
    }
    const pollInterval = dto.routerPollIntervalSeconds ?? dto.monitoringIntervalSeconds;
    if (pollInterval !== undefined) {
      updateData.routerPollIntervalSeconds = pollInterval;
    }
    if (dto.timezone !== undefined) {
      updateData.timezone = dto.timezone;
    }
    if (dto.retentionDays !== undefined) {
      updateData.retentionDays = dto.retentionDays;
    }
    if (dto.notificationsEnabled !== undefined) {
      updateData.notificationsEnabled = Boolean(dto.notificationsEnabled);
    }

    await this.db.update(appSettings).set(updateData).where(eq(appSettings.id, 1));
    return this.getSettings();
  }
}
