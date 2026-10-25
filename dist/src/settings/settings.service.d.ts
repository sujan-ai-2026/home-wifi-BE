import { OnModuleInit } from '@nestjs/common';
import { DrizzleDb } from '../database/database.provider';
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
export declare class SettingsService implements OnModuleInit {
    private readonly db;
    private readonly logger;
    constructor(db: DrizzleDb);
    onModuleInit(): Promise<void>;
    ensureSettingsRow(): Promise<void>;
    getSettings(): Promise<AppSettingsResponse>;
    updateSettings(dto: UpdateSettingsDto): Promise<any>;
}
