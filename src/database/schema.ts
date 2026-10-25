import {
  pgTable,
  text,
  varchar,
  timestamp,
  numeric,
  integer,
  boolean,
  bigint,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Users table for dashboard owner / admin authentication
 */
export const users = pgTable(
  'users',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    username: varchar('username', { length: 100 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: varchar('role', { length: 20 }).notNull().default('admin'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('users_username_idx').on(table.username),
  ],
);

/**
 * Speed tests table
 * Note: Failed tests must not be represented as zero-speed results (download/upload are null on failure)
 */
export const speedTests = pgTable(
  'speed_tests',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    downloadMbps: numeric('download_mbps', { precision: 10, scale: 2 }),
    uploadMbps: numeric('upload_mbps', { precision: 10, scale: 2 }),
    latencyMs: numeric('latency_ms', { precision: 10, scale: 2 }),
    jitterMs: numeric('jitter_ms', { precision: 10, scale: 2 }),
    serverName: text('server_name'),
    provider: varchar('provider', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(), // 'success' | 'failed'
    errorCode: varchar('error_code', { length: 50 }),
    errorMessage: text('error_message'),
    measuredAt: timestamp('measured_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('speed_tests_measured_at_idx').on(table.measuredAt),
    index('speed_tests_status_idx').on(table.status),
    index('speed_tests_provider_idx').on(table.provider),
  ],
);

/**
 * Devices table
 * Deduplication and identity normalization for physical devices across changing IP / MAC randomization
 */
export const devices = pgTable(
  'devices',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    macAddress: varchar('mac_address', { length: 32 }),
    hostname: varchar('hostname', { length: 255 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    deviceType: varchar('device_type', { length: 50 }).notNull().default('unknown'),
    connectionType: varchar('connection_type', { length: 50 }).notNull().default('unknown'),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
    isOnline: boolean('is_online').notNull().default(true),
    source: varchar('source', { length: 50 }).notNull().default('router_poll'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('devices_mac_address_idx').on(table.macAddress),
    index('devices_ip_address_idx').on(table.ipAddress),
    index('devices_hostname_idx').on(table.hostname),
    index('devices_is_online_idx').on(table.isOnline),
    index('devices_last_seen_at_idx').on(table.lastSeenAt),
  ],
);

/**
 * Device observations history
 */
export const deviceObservations = pgTable(
  'device_observations',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    deviceId: varchar('device_id', { length: 36 })
      .notNull()
      .references(() => devices.id, { onDelete: 'cascade' }),
    observedAt: timestamp('observed_at', { withTimezone: true }).defaultNow().notNull(),
    isOnline: boolean('is_online').notNull(),
    source: varchar('source', { length: 50 }).notNull(),
  },
  (table) => [
    index('device_obs_device_id_idx').on(table.deviceId),
    index('device_obs_observed_at_idx').on(table.observedAt),
  ],
);

/**
 * Router snapshots table
 */
export const routerSnapshots = pgTable(
  'router_snapshots',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    wanConnected: boolean('wan_connected'),
    routerUptimeSeconds: bigint('router_uptime_seconds', { mode: 'number' }),
    receivedBytes: bigint('received_bytes', { mode: 'number' }),
    transmittedBytes: bigint('transmitted_bytes', { mode: 'number' }),
    observedAt: timestamp('observed_at', { withTimezone: true }).defaultNow().notNull(),
    source: varchar('source', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(), // 'ok' | 'degraded' | 'unreachable' | 'unsupported'
  },
  (table) => [
    index('router_snapshots_observed_at_idx').on(table.observedAt),
    index('router_snapshots_status_idx').on(table.status),
  ],
);

/**
 * Alert events table
 * Enforces single active incident per metric using incidentKey & idempotency
 */
export const alertEvents = pgTable(
  'alert_events',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    incidentKey: varchar('incident_key', { length: 255 }).notNull(),
    metric: varchar('metric', { length: 50 }).notNull(), // 'download' | 'upload'
    measuredValue: numeric('measured_value', { precision: 10, scale: 2 }).notNull(),
    thresholdValue: numeric('threshold_value', { precision: 10, scale: 2 }).notNull(),
    severity: varchar('severity', { length: 20 }).notNull().default('warning'), // 'warning' | 'critical'
    status: varchar('status', { length: 30 }).notNull().default('active'), // 'pending' | 'active' | 'resolved' | 'delivery_failed'
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    lastBreachAt: timestamp('last_breach_at', { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('alert_events_incident_key_idx').on(table.incidentKey),
    index('alert_events_metric_idx').on(table.metric),
    index('alert_events_status_idx').on(table.status),
    index('alert_events_started_at_idx').on(table.startedAt),
  ],
);

/**
 * Web Push Subscriptions
 */
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: varchar('user_id', { length: 36 }).notNull(),
    endpoint: text('endpoint').notNull().unique(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
    lastFailureAt: timestamp('last_failure_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('push_sub_endpoint_idx').on(table.endpoint),
    index('push_sub_user_id_idx').on(table.userId),
  ],
);

/**
 * Notification deliveries
 */
export const notificationDeliveries = pgTable(
  'notification_deliveries',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    alertEventId: varchar('alert_event_id', { length: 36 })
      .notNull()
      .references(() => alertEvents.id, { onDelete: 'cascade' }),
    subscriptionId: varchar('subscription_id', { length: 36 })
      .notNull()
      .references(() => pushSubscriptions.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 30 }).notNull().default('pending'), // 'pending' | 'accepted' | 'delivered' | 'failed'
    attemptCount: integer('attempt_count').notNull().default(0),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }).defaultNow().notNull(),
    deliveredOrAcceptedAt: timestamp('delivered_or_accepted_at', { withTimezone: true }),
    errorCode: varchar('error_code', { length: 100 }),
  },
  (table) => [
    index('notif_deliv_alert_idx').on(table.alertEventId),
    index('notif_deliv_sub_idx').on(table.subscriptionId),
    index('notif_deliv_status_idx').on(table.status),
  ],
);

/**
 * Daily metrics table (aggregated rollups)
 */
export const dailyMetrics = pgTable(
  'daily_metrics',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    metricDate: varchar('metric_date', { length: 10 }).notNull().unique(), // 'YYYY-MM-DD'
    averageDownloadMbps: numeric('average_download_mbps', { precision: 10, scale: 2 }),
    averageUploadMbps: numeric('average_upload_mbps', { precision: 10, scale: 2 }),
    minimumDownloadMbps: numeric('minimum_download_mbps', { precision: 10, scale: 2 }),
    minimumUploadMbps: numeric('minimum_upload_mbps', { precision: 10, scale: 2 }),
    maximumDownloadMbps: numeric('maximum_download_mbps', { precision: 10, scale: 2 }),
    maximumUploadMbps: numeric('maximum_upload_mbps', { precision: 10, scale: 2 }),
    estimatedUptimePercentage: numeric('estimated_uptime_percentage', { precision: 5, scale: 2 }),
    outageDurationSeconds: integer('outage_duration_seconds').default(0),
    lowSpeedIncidentCount: integer('low_speed_incident_count').notNull().default(0),
    receivedBytes: bigint('received_bytes', { mode: 'number' }),
    transmittedBytes: bigint('transmitted_bytes', { mode: 'number' }),
    calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('daily_metrics_date_idx').on(table.metricDate),
  ],
);

/**
 * Application settings singleton table
 */
export const appSettings = pgTable(
  'app_settings',
  {
    id: integer('id').primaryKey().default(1),
    downloadThresholdMbps: numeric('download_threshold_mbps', { precision: 10, scale: 2 }).notNull().default('10.00'),
    uploadThresholdMbps: numeric('upload_threshold_mbps', { precision: 10, scale: 2 }).notNull().default('10.00'),
    consecutiveBreachesRequired: integer('consecutive_breaches_required').notNull().default(2),
    recoveryThresholdMbps: numeric('recovery_threshold_mbps', { precision: 10, scale: 2 }).notNull().default('12.00'),
    recoverySamplesRequired: integer('recovery_samples_required').notNull().default(1),
    speedTestIntervalMinutes: integer('speed_test_interval_minutes').notNull().default(15),
    routerPollIntervalSeconds: integer('router_poll_interval_seconds').notNull().default(60),
    timezone: varchar('timezone', { length: 100 }).notNull().default('Asia/Kolkata'),
    retentionDays: integer('retention_days').notNull().default(90),
    notificationsEnabled: boolean('notifications_enabled').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
);
