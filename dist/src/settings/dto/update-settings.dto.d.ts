export declare class UpdateSettingsDto {
    downloadThresholdMbps?: number;
    uploadThresholdMbps?: number;
    consecutiveBreachesRequired?: number;
    recoveryThresholdMbps?: number;
    recoverySamplesRequired?: number;
    speedTestIntervalMinutes?: number;
    routerPollIntervalSeconds?: number;
    timezone?: string;
    retentionDays?: number;
    speedThresholdMbps?: number;
    monitoringIntervalSeconds?: number;
    notificationsEnabled?: boolean;
}
