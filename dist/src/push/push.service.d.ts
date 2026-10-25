import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DrizzleDb } from '../database/database.provider';
import { alertEvents } from '../database/schema';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
export declare class PushService implements OnModuleInit {
    private readonly db;
    private readonly configService;
    private readonly logger;
    private vapidConfigured;
    constructor(db: DrizzleDb, configService: ConfigService);
    onModuleInit(): void;
    private configureVapid;
    getStatus(): {
        configured: boolean;
        publicKey: string | null;
    };
    subscribe(userId: string, dto: PushSubscriptionDto): Promise<{
        success: boolean;
        message: string;
    }>;
    unsubscribe(endpoint: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendAlertNotifications(alert: typeof alertEvents.$inferSelect): Promise<void>;
    sendDeviceAlertNotification(params: {
        event: 'connected' | 'disconnected';
        deviceName: string;
        ipAddress?: string | null;
        macAddress?: string | null;
    }): Promise<void>;
}
