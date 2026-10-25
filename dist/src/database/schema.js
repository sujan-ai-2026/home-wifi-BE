"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appSettings = exports.dailyMetrics = exports.notificationDeliveries = exports.pushSubscriptions = exports.alertEvents = exports.routerSnapshots = exports.deviceObservations = exports.devices = exports.speedTests = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    username: (0, pg_core_1.varchar)('username', { length: 100 }).notNull().unique(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    role: (0, pg_core_1.varchar)('role', { length: 20 }).notNull().default('admin'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.uniqueIndex)('users_username_idx').on(table.username),
]);
exports.speedTests = (0, pg_core_1.pgTable)('speed_tests', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    downloadMbps: (0, pg_core_1.numeric)('download_mbps', { precision: 10, scale: 2 }),
    uploadMbps: (0, pg_core_1.numeric)('upload_mbps', { precision: 10, scale: 2 }),
    latencyMs: (0, pg_core_1.numeric)('latency_ms', { precision: 10, scale: 2 }),
    jitterMs: (0, pg_core_1.numeric)('jitter_ms', { precision: 10, scale: 2 }),
    serverName: (0, pg_core_1.text)('server_name'),
    provider: (0, pg_core_1.varchar)('provider', { length: 50 }).notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull(),
    errorCode: (0, pg_core_1.varchar)('error_code', { length: 50 }),
    errorMessage: (0, pg_core_1.text)('error_message'),
    measuredAt: (0, pg_core_1.timestamp)('measured_at', { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('speed_tests_measured_at_idx').on(table.measuredAt),
    (0, pg_core_1.index)('speed_tests_status_idx').on(table.status),
    (0, pg_core_1.index)('speed_tests_provider_idx').on(table.provider),
]);
exports.devices = (0, pg_core_1.pgTable)('devices', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    macAddress: (0, pg_core_1.varchar)('mac_address', { length: 32 }),
    hostname: (0, pg_core_1.varchar)('hostname', { length: 255 }),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }),
    deviceType: (0, pg_core_1.varchar)('device_type', { length: 50 }).notNull().default('unknown'),
    connectionType: (0, pg_core_1.varchar)('connection_type', { length: 50 }).notNull().default('unknown'),
    firstSeenAt: (0, pg_core_1.timestamp)('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: (0, pg_core_1.timestamp)('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
    isOnline: (0, pg_core_1.boolean)('is_online').notNull().default(true),
    source: (0, pg_core_1.varchar)('source', { length: 50 }).notNull().default('router_poll'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('devices_mac_address_idx').on(table.macAddress),
    (0, pg_core_1.index)('devices_ip_address_idx').on(table.ipAddress),
    (0, pg_core_1.index)('devices_hostname_idx').on(table.hostname),
    (0, pg_core_1.index)('devices_is_online_idx').on(table.isOnline),
    (0, pg_core_1.index)('devices_last_seen_at_idx').on(table.lastSeenAt),
]);
exports.deviceObservations = (0, pg_core_1.pgTable)('device_observations', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    deviceId: (0, pg_core_1.varchar)('device_id', { length: 36 })
        .notNull()
        .references(() => exports.devices.id, { onDelete: 'cascade' }),
    observedAt: (0, pg_core_1.timestamp)('observed_at', { withTimezone: true }).defaultNow().notNull(),
    isOnline: (0, pg_core_1.boolean)('is_online').notNull(),
    source: (0, pg_core_1.varchar)('source', { length: 50 }).notNull(),
}, (table) => [
    (0, pg_core_1.index)('device_obs_device_id_idx').on(table.deviceId),
    (0, pg_core_1.index)('device_obs_observed_at_idx').on(table.observedAt),
]);
exports.routerSnapshots = (0, pg_core_1.pgTable)('router_snapshots', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    wanConnected: (0, pg_core_1.boolean)('wan_connected'),
    routerUptimeSeconds: (0, pg_core_1.bigint)('router_uptime_seconds', { mode: 'number' }),
    receivedBytes: (0, pg_core_1.bigint)('received_bytes', { mode: 'number' }),
    transmittedBytes: (0, pg_core_1.bigint)('transmitted_bytes', { mode: 'number' }),
    observedAt: (0, pg_core_1.timestamp)('observed_at', { withTimezone: true }).defaultNow().notNull(),
    source: (0, pg_core_1.varchar)('source', { length: 50 }).notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull(),
}, (table) => [
    (0, pg_core_1.index)('router_snapshots_observed_at_idx').on(table.observedAt),
    (0, pg_core_1.index)('router_snapshots_status_idx').on(table.status),
]);
exports.alertEvents = (0, pg_core_1.pgTable)('alert_events', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    incidentKey: (0, pg_core_1.varchar)('incident_key', { length: 255 }).notNull(),
    metric: (0, pg_core_1.varchar)('metric', { length: 50 }).notNull(),
    measuredValue: (0, pg_core_1.numeric)('measured_value', { precision: 10, scale: 2 }).notNull(),
    thresholdValue: (0, pg_core_1.numeric)('threshold_value', { precision: 10, scale: 2 }).notNull(),
    severity: (0, pg_core_1.varchar)('severity', { length: 20 }).notNull().default('warning'),
    status: (0, pg_core_1.varchar)('status', { length: 30 }).notNull().default('active'),
    startedAt: (0, pg_core_1.timestamp)('started_at', { withTimezone: true }).defaultNow().notNull(),
    lastBreachAt: (0, pg_core_1.timestamp)('last_breach_at', { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: (0, pg_core_1.timestamp)('resolved_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('alert_events_incident_key_idx').on(table.incidentKey),
    (0, pg_core_1.index)('alert_events_metric_idx').on(table.metric),
    (0, pg_core_1.index)('alert_events_status_idx').on(table.status),
    (0, pg_core_1.index)('alert_events_started_at_idx').on(table.startedAt),
]);
exports.pushSubscriptions = (0, pg_core_1.pgTable)('push_subscriptions', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: (0, pg_core_1.varchar)('user_id', { length: 36 }).notNull(),
    endpoint: (0, pg_core_1.text)('endpoint').notNull().unique(),
    p256dh: (0, pg_core_1.text)('p256dh').notNull(),
    auth: (0, pg_core_1.text)('auth').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
    lastSuccessAt: (0, pg_core_1.timestamp)('last_success_at', { withTimezone: true }),
    lastFailureAt: (0, pg_core_1.timestamp)('last_failure_at', { withTimezone: true }),
}, (table) => [
    (0, pg_core_1.uniqueIndex)('push_sub_endpoint_idx').on(table.endpoint),
    (0, pg_core_1.index)('push_sub_user_id_idx').on(table.userId),
]);
exports.notificationDeliveries = (0, pg_core_1.pgTable)('notification_deliveries', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    alertEventId: (0, pg_core_1.varchar)('alert_event_id', { length: 36 })
        .notNull()
        .references(() => exports.alertEvents.id, { onDelete: 'cascade' }),
    subscriptionId: (0, pg_core_1.varchar)('subscription_id', { length: 36 })
        .notNull()
        .references(() => exports.pushSubscriptions.id, { onDelete: 'cascade' }),
    status: (0, pg_core_1.varchar)('status', { length: 30 }).notNull().default('pending'),
    attemptCount: (0, pg_core_1.integer)('attempt_count').notNull().default(0),
    attemptedAt: (0, pg_core_1.timestamp)('attempted_at', { withTimezone: true }).defaultNow().notNull(),
    deliveredOrAcceptedAt: (0, pg_core_1.timestamp)('delivered_or_accepted_at', { withTimezone: true }),
    errorCode: (0, pg_core_1.varchar)('error_code', { length: 100 }),
}, (table) => [
    (0, pg_core_1.index)('notif_deliv_alert_idx').on(table.alertEventId),
    (0, pg_core_1.index)('notif_deliv_sub_idx').on(table.subscriptionId),
    (0, pg_core_1.index)('notif_deliv_status_idx').on(table.status),
]);
exports.dailyMetrics = (0, pg_core_1.pgTable)('daily_metrics', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    metricDate: (0, pg_core_1.varchar)('metric_date', { length: 10 }).notNull().unique(),
    averageDownloadMbps: (0, pg_core_1.numeric)('average_download_mbps', { precision: 10, scale: 2 }),
    averageUploadMbps: (0, pg_core_1.numeric)('average_upload_mbps', { precision: 10, scale: 2 }),
    minimumDownloadMbps: (0, pg_core_1.numeric)('minimum_download_mbps', { precision: 10, scale: 2 }),
    minimumUploadMbps: (0, pg_core_1.numeric)('minimum_upload_mbps', { precision: 10, scale: 2 }),
    maximumDownloadMbps: (0, pg_core_1.numeric)('maximum_download_mbps', { precision: 10, scale: 2 }),
    maximumUploadMbps: (0, pg_core_1.numeric)('maximum_upload_mbps', { precision: 10, scale: 2 }),
    estimatedUptimePercentage: (0, pg_core_1.numeric)('estimated_uptime_percentage', { precision: 5, scale: 2 }),
    outageDurationSeconds: (0, pg_core_1.integer)('outage_duration_seconds').default(0),
    lowSpeedIncidentCount: (0, pg_core_1.integer)('low_speed_incident_count').notNull().default(0),
    receivedBytes: (0, pg_core_1.bigint)('received_bytes', { mode: 'number' }),
    transmittedBytes: (0, pg_core_1.bigint)('transmitted_bytes', { mode: 'number' }),
    calculatedAt: (0, pg_core_1.timestamp)('calculated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.uniqueIndex)('daily_metrics_date_idx').on(table.metricDate),
]);
exports.appSettings = (0, pg_core_1.pgTable)('app_settings', {
    id: (0, pg_core_1.integer)('id').primaryKey().default(1),
    downloadThresholdMbps: (0, pg_core_1.numeric)('download_threshold_mbps', { precision: 10, scale: 2 }).notNull().default('10.00'),
    uploadThresholdMbps: (0, pg_core_1.numeric)('upload_threshold_mbps', { precision: 10, scale: 2 }).notNull().default('10.00'),
    consecutiveBreachesRequired: (0, pg_core_1.integer)('consecutive_breaches_required').notNull().default(2),
    recoveryThresholdMbps: (0, pg_core_1.numeric)('recovery_threshold_mbps', { precision: 10, scale: 2 }).notNull().default('12.00'),
    recoverySamplesRequired: (0, pg_core_1.integer)('recovery_samples_required').notNull().default(1),
    speedTestIntervalMinutes: (0, pg_core_1.integer)('speed_test_interval_minutes').notNull().default(15),
    routerPollIntervalSeconds: (0, pg_core_1.integer)('router_poll_interval_seconds').notNull().default(60),
    timezone: (0, pg_core_1.varchar)('timezone', { length: 100 }).notNull().default('Asia/Kolkata'),
    retentionDays: (0, pg_core_1.integer)('retention_days').notNull().default(90),
    notificationsEnabled: (0, pg_core_1.boolean)('notifications_enabled').notNull().default(true),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
//# sourceMappingURL=schema.js.map