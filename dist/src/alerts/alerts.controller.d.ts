import { AlertsService } from './alerts.service';
import { AlertsQueryDto } from './dto/alerts-query.dto';
export declare class AlertsController {
    private readonly alertsService;
    constructor(alertsService: AlertsService);
    getAlerts(query: AlertsQueryDto): Promise<{
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
}
