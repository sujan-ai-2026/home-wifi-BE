import { DrizzleDb } from '../database/database.provider';
import { SettingsService } from '../settings/settings.service';
import { PushService } from '../push/push.service';
import { RealtimeService } from '../realtime/realtime.service';
import { AlertsQueryDto } from './dto/alerts-query.dto';
export declare class AlertsService {
    private readonly db;
    private readonly settingsService;
    private readonly pushService;
    private readonly realtimeService;
    private readonly logger;
    private consecutiveBreaches;
    private consecutiveRecoveries;
    constructor(db: DrizzleDb, settingsService: SettingsService, pushService: PushService, realtimeService: RealtimeService);
    evaluateMeasurement(downloadMbps: number, uploadMbps: number, measuredAt: Date): Promise<void>;
    private evaluateMetric;
    listAlerts(query: AlertsQueryDto): Promise<{
        items: {
            measuredValue: number;
            thresholdValue: number;
            title: string;
            detail: string;
            timestamp: string;
            acknowledged: boolean;
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            incidentKey: string;
            metric: string;
            severity: string;
            startedAt: Date;
            lastBreachAt: Date;
            resolvedAt: Date | null;
        }[];
        meta: {
            page: number;
            limit: number;
            totalItems: number;
            totalPages: number;
        };
    }>;
    purgeOldAlerts(): Promise<import("pg").QueryResult<never>>;
    getAlertById(id: string): Promise<{
        measuredValue: number;
        thresholdValue: number;
        notificationDeliveries: {
            status: string;
            id: string;
            errorCode: string | null;
            alertEventId: string;
            subscriptionId: string;
            attemptCount: number;
            attemptedAt: Date;
            deliveredOrAcceptedAt: Date | null;
        }[];
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        incidentKey: string;
        metric: string;
        severity: string;
        startedAt: Date;
        lastBreachAt: Date;
        resolvedAt: Date | null;
    }>;
    getActiveIncidentCount(): Promise<number>;
}
