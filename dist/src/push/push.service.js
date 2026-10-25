"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PushService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const webPush = require("web-push");
const drizzle_orm_1 = require("drizzle-orm");
const database_provider_1 = require("../database/database.provider");
const schema_1 = require("../database/schema");
let PushService = PushService_1 = class PushService {
    constructor(db, configService) {
        this.db = db;
        this.configService = configService;
        this.logger = new common_1.Logger(PushService_1.name);
        this.vapidConfigured = false;
    }
    onModuleInit() {
        this.configureVapid();
    }
    configureVapid() {
        const publicKey = this.configService.get('app.vapidPublicKey');
        const privateKey = this.configService.get('app.vapidPrivateKey');
        const subject = this.configService.get('app.vapidSubject') ||
            'mailto:admin@homenet.local';
        if (publicKey && privateKey) {
            try {
                webPush.setVapidDetails(subject, publicKey, privateKey);
                this.vapidConfigured = true;
                this.logger.log('Web Push VAPID keys initialized successfully');
            }
            catch (err) {
                this.logger.warn(`Failed to initialize VAPID keys: ${err.message}`);
            }
        }
        else {
            this.logger.warn('VAPID keys not fully configured. Push notifications will be simulated.');
        }
    }
    getStatus() {
        return {
            configured: this.vapidConfigured,
            publicKey: this.configService.get('app.vapidPublicKey') || null,
        };
    }
    async subscribe(userId, dto) {
        const now = new Date();
        const [existing] = await this.db
            .select()
            .from(schema_1.pushSubscriptions)
            .where((0, drizzle_orm_1.eq)(schema_1.pushSubscriptions.endpoint, dto.endpoint))
            .limit(1);
        if (existing) {
            await this.db
                .update(schema_1.pushSubscriptions)
                .set({
                userId: userId || existing.userId,
                p256dh: dto.keys.p256dh,
                auth: dto.keys.auth,
                updatedAt: now,
            })
                .where((0, drizzle_orm_1.eq)(schema_1.pushSubscriptions.id, existing.id));
            return { success: true, message: 'Push subscription updated' };
        }
        await this.db.insert(schema_1.pushSubscriptions).values({
            userId: userId || 'owner',
            endpoint: dto.endpoint,
            p256dh: dto.keys.p256dh,
            auth: dto.keys.auth,
            createdAt: now,
            updatedAt: now,
        });
        return { success: true, message: 'Push subscription registered' };
    }
    async unsubscribe(endpoint) {
        await this.db
            .delete(schema_1.pushSubscriptions)
            .where((0, drizzle_orm_1.eq)(schema_1.pushSubscriptions.endpoint, endpoint));
        return { success: true, message: 'Push subscription removed' };
    }
    async sendAlertNotifications(alert) {
        const subs = await this.db.select().from(schema_1.pushSubscriptions);
        if (subs.length === 0) {
            this.logger.debug('No active push subscriptions to notify.');
            return;
        }
        const payload = JSON.stringify({
            title: 'HomeNet: Internet speed is low',
            body: `${alert.metric.toUpperCase()} speed dropped to ${alert.measuredValue} Mbps (threshold: ${alert.thresholdValue} Mbps)`,
            data: {
                alertId: alert.id,
                metric: alert.metric,
                measuredValue: alert.measuredValue,
                thresholdValue: alert.thresholdValue,
                timestamp: alert.startedAt.toISOString(),
                url: `/alerts/${alert.id}`,
            },
            tag: `alert-${alert.metric}`,
        });
        for (const sub of subs) {
            const now = new Date();
            let deliveryStatus = 'pending';
            let errorCode = null;
            try {
                if (this.vapidConfigured) {
                    const pushSubscriptionData = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    };
                    const result = await webPush.sendNotification(pushSubscriptionData, payload, { TTL: 3600 });
                    if (result.statusCode === 201 || result.statusCode === 200) {
                        deliveryStatus = 'accepted';
                        await this.db
                            .update(schema_1.pushSubscriptions)
                            .set({ lastSuccessAt: now, updatedAt: now })
                            .where((0, drizzle_orm_1.eq)(schema_1.pushSubscriptions.id, sub.id));
                    }
                    else {
                        deliveryStatus = 'failed';
                        errorCode = `HTTP_${result.statusCode}`;
                    }
                }
                else {
                    deliveryStatus = 'accepted';
                }
            }
            catch (err) {
                deliveryStatus = 'failed';
                errorCode = err.statusCode ? `HTTP_${err.statusCode}` : err.code || 'UNKNOWN';
                await this.db
                    .update(schema_1.pushSubscriptions)
                    .set({ lastFailureAt: now, updatedAt: now })
                    .where((0, drizzle_orm_1.eq)(schema_1.pushSubscriptions.id, sub.id));
                if (err.statusCode === 410 || err.statusCode === 404) {
                    this.logger.warn(`Removing expired push subscription ${sub.id}`);
                    await this.db
                        .delete(schema_1.pushSubscriptions)
                        .where((0, drizzle_orm_1.eq)(schema_1.pushSubscriptions.id, sub.id));
                }
            }
            try {
                await this.db.insert(schema_1.notificationDeliveries).values({
                    alertEventId: alert.id,
                    subscriptionId: sub.id,
                    status: deliveryStatus,
                    attemptCount: 1,
                    attemptedAt: now,
                    deliveredOrAcceptedAt: deliveryStatus === 'accepted' ? now : null,
                    errorCode: errorCode ?? null,
                });
            }
            catch (logErr) {
                this.logger.error(`Failed to record notification delivery: ${logErr.message}`);
            }
        }
    }
    async sendDeviceAlertNotification(params) {
        try {
            const [settings] = await this.db.select().from(schema_1.appSettings).where((0, drizzle_orm_1.eq)(schema_1.appSettings.id, 1)).limit(1);
            if (settings && !settings.notificationsEnabled) {
                this.logger.debug('Notifications disabled in settings, skipping device push delivery');
                return;
            }
            const isConn = params.event === 'connected';
            const title = isConn ? 'HomeNet: New Device Connected' : 'HomeNet: Device Disconnected';
            const body = isConn
                ? `${params.deviceName} (${params.ipAddress || 'Wi-Fi'}) joined your home network.`
                : `${params.deviceName} (${params.ipAddress || 'Wi-Fi'}) disconnected from your network.`;
            const subs = await this.db.select().from(schema_1.pushSubscriptions);
            if (subs.length === 0)
                return;
            const payload = JSON.stringify({
                title,
                body,
                data: {
                    event: params.event,
                    deviceName: params.deviceName,
                    ipAddress: params.ipAddress,
                    macAddress: params.macAddress,
                    timestamp: new Date().toISOString(),
                    url: '/devices',
                },
                tag: `device-${params.event}-${params.macAddress || params.ipAddress || 'event'}`,
            });
            for (const sub of subs) {
                try {
                    if (this.vapidConfigured) {
                        await webPush.sendNotification({
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth,
                            },
                        }, payload, { TTL: 3600 });
                    }
                }
                catch (err) {
                    this.logger.warn(`Failed to deliver device push notification: ${err.message}`);
                }
            }
        }
        catch (err) {
            this.logger.error(`Error sending device alert push notification: ${err.message}`);
        }
    }
};
exports.PushService = PushService;
exports.PushService = PushService = PushService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_provider_1.DRIZZLE_ORM)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService])
], PushService);
//# sourceMappingURL=push.service.js.map