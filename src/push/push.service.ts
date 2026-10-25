import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webPush from 'web-push';
import { eq, count } from 'drizzle-orm';
import { DRIZZLE_ORM, DrizzleDb } from '../database/database.provider';
import { pushSubscriptions, notificationDeliveries, alertEvents, appSettings } from '../database/schema';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private vapidConfigured = false;

  constructor(
    @Inject(DRIZZLE_ORM) private readonly db: DrizzleDb,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.configureVapid();
  }

  private configureVapid() {
    const publicKey = this.configService.get<string>('app.vapidPublicKey');
    const privateKey = this.configService.get<string>('app.vapidPrivateKey');
    const subject =
      this.configService.get<string>('app.vapidSubject') ||
      'mailto:admin@homenet.local';

    if (publicKey && privateKey) {
      try {
        webPush.setVapidDetails(subject, publicKey, privateKey);
        this.vapidConfigured = true;
        this.logger.log('Web Push VAPID keys initialized successfully');
      } catch (err: any) {
        this.logger.warn(`Failed to initialize VAPID keys: ${err.message}`);
      }
    } else {
      this.logger.warn(
        'VAPID keys not fully configured. Push notifications will be simulated.',
      );
    }
  }

  getStatus() {
    return {
      configured: this.vapidConfigured,
      publicKey: this.configService.get<string>('app.vapidPublicKey') || null,
    };
  }

  async subscribe(userId: string, dto: PushSubscriptionDto) {
    const now = new Date();

    const [existing] = await this.db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, dto.endpoint))
      .limit(1);

    if (existing) {
      await this.db
        .update(pushSubscriptions)
        .set({
          userId: userId || existing.userId,
          p256dh: dto.keys.p256dh,
          auth: dto.keys.auth,
          updatedAt: now,
        })
        .where(eq(pushSubscriptions.id, existing.id));

      return { success: true, message: 'Push subscription updated' };
    }

    await this.db.insert(pushSubscriptions).values({
      userId: userId || 'owner',
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, message: 'Push subscription registered' };
  }

  async unsubscribe(endpoint: string) {
    await this.db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));

    return { success: true, message: 'Push subscription removed' };
  }

  async sendAlertNotifications(alert: typeof alertEvents.$inferSelect) {
    const subs = await this.db.select().from(pushSubscriptions);
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
      let errorCode: string | null = null;

      try {
        if (this.vapidConfigured) {
          const pushSubscriptionData = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          const result = await webPush.sendNotification(
            pushSubscriptionData,
            payload,
            { TTL: 3600 },
          );

          if (result.statusCode === 201 || result.statusCode === 200) {
            deliveryStatus = 'accepted';
            await this.db
              .update(pushSubscriptions)
              .set({ lastSuccessAt: now, updatedAt: now })
              .where(eq(pushSubscriptions.id, sub.id));
          } else {
            deliveryStatus = 'failed';
            errorCode = `HTTP_${result.statusCode}`;
          }
        } else {
          // Simulation mode when VAPID keys are unset or in test
          deliveryStatus = 'accepted';
        }
      } catch (err: any) {
        deliveryStatus = 'failed';
        errorCode = err.statusCode ? `HTTP_${err.statusCode}` : err.code || 'UNKNOWN';

        await this.db
          .update(pushSubscriptions)
          .set({ lastFailureAt: now, updatedAt: now })
          .where(eq(pushSubscriptions.id, sub.id));

        // Expired subscription cleanup (410 Gone or 404 Not Found)
        if (err.statusCode === 410 || err.statusCode === 404) {
          this.logger.warn(`Removing expired push subscription ${sub.id}`);
          await this.db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        }
      }

      // Record delivery log
      try {
        await this.db.insert(notificationDeliveries).values({
          alertEventId: alert.id,
          subscriptionId: sub.id,
          status: deliveryStatus,
          attemptCount: 1,
          attemptedAt: now,
          deliveredOrAcceptedAt: deliveryStatus === 'accepted' ? now : null,
          errorCode: errorCode ?? null,
        });
      } catch (logErr: any) {
        this.logger.error(`Failed to record notification delivery: ${logErr.message}`);
      }
    }
  }

  /**
   * Broadcasts device connection / disconnection push notifications
   */
  async sendDeviceAlertNotification(params: {
    event: 'connected' | 'disconnected';
    deviceName: string;
    ipAddress?: string | null;
    macAddress?: string | null;
  }) {
    try {
      const [settings] = await this.db.select().from(appSettings).where(eq(appSettings.id, 1)).limit(1);
      if (settings && !settings.notificationsEnabled) {
        this.logger.debug('Notifications disabled in settings, skipping device push delivery');
        return;
      }

      const isConn = params.event === 'connected';
      const title = isConn ? 'HomeNet: New Device Connected' : 'HomeNet: Device Disconnected';
      const body = isConn
        ? `${params.deviceName} (${params.ipAddress || 'Wi-Fi'}) joined your home network.`
        : `${params.deviceName} (${params.ipAddress || 'Wi-Fi'}) disconnected from your network.`;

      const subs = await this.db.select().from(pushSubscriptions);
      if (subs.length === 0) return;

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
            await webPush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              payload,
              { TTL: 3600 },
            );
          }
        } catch (err: any) {
          this.logger.warn(`Failed to deliver device push notification: ${err.message}`);
        }
      }
    } catch (err: any) {
      this.logger.error(`Error sending device alert push notification: ${err.message}`);
    }
  }
}
