CREATE TABLE "alert_events" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"incident_key" varchar(100) NOT NULL,
	"metric" varchar(50) NOT NULL,
	"measured_value" numeric(10, 2) NOT NULL,
	"threshold_value" numeric(10, 2) NOT NULL,
	"severity" varchar(20) DEFAULT 'warning' NOT NULL,
	"status" varchar(30) DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_breach_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"download_threshold_mbps" numeric(10, 2) DEFAULT '10.00' NOT NULL,
	"upload_threshold_mbps" numeric(10, 2) DEFAULT '10.00' NOT NULL,
	"consecutive_breaches_required" integer DEFAULT 2 NOT NULL,
	"recovery_threshold_mbps" numeric(10, 2) DEFAULT '12.00' NOT NULL,
	"recovery_samples_required" integer DEFAULT 1 NOT NULL,
	"speed_test_interval_minutes" integer DEFAULT 15 NOT NULL,
	"router_poll_interval_seconds" integer DEFAULT 60 NOT NULL,
	"timezone" varchar(100) DEFAULT 'Asia/Kolkata' NOT NULL,
	"retention_days" integer DEFAULT 90 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_metrics" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"metric_date" varchar(10) NOT NULL,
	"average_download_mbps" numeric(10, 2),
	"average_upload_mbps" numeric(10, 2),
	"minimum_download_mbps" numeric(10, 2),
	"minimum_upload_mbps" numeric(10, 2),
	"maximum_download_mbps" numeric(10, 2),
	"maximum_upload_mbps" numeric(10, 2),
	"estimated_uptime_percentage" numeric(5, 2),
	"outage_duration_seconds" integer DEFAULT 0,
	"low_speed_incident_count" integer DEFAULT 0 NOT NULL,
	"received_bytes" bigint,
	"transmitted_bytes" bigint,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_metrics_metric_date_unique" UNIQUE("metric_date")
);
--> statement-breakpoint
CREATE TABLE "device_observations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"device_id" varchar(36) NOT NULL,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_online" boolean NOT NULL,
	"source" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"mac_address" varchar(32),
	"hostname" varchar(255),
	"ip_address" varchar(45),
	"device_type" varchar(50) DEFAULT 'unknown' NOT NULL,
	"connection_type" varchar(50) DEFAULT 'unknown' NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_online" boolean DEFAULT true NOT NULL,
	"source" varchar(50) DEFAULT 'router_poll' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"alert_event_id" varchar(36) NOT NULL,
	"subscription_id" varchar(36) NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_or_accepted_at" timestamp with time zone,
	"error_code" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_failure_at" timestamp with time zone,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "router_snapshots" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"wan_connected" boolean,
	"router_uptime_seconds" bigint,
	"received_bytes" bigint,
	"transmitted_bytes" bigint,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speed_tests" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"download_mbps" numeric(10, 2),
	"upload_mbps" numeric(10, 2),
	"latency_ms" numeric(10, 2),
	"jitter_ms" numeric(10, 2),
	"server_name" text,
	"provider" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"error_code" varchar(50),
	"error_message" text,
	"measured_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "device_observations" ADD CONSTRAINT "device_observations_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_alert_event_id_alert_events_id_fk" FOREIGN KEY ("alert_event_id") REFERENCES "public"."alert_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_subscription_id_push_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."push_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alert_events_incident_key_idx" ON "alert_events" USING btree ("incident_key");--> statement-breakpoint
CREATE INDEX "alert_events_metric_idx" ON "alert_events" USING btree ("metric");--> statement-breakpoint
CREATE INDEX "alert_events_status_idx" ON "alert_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "alert_events_started_at_idx" ON "alert_events" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_metrics_date_idx" ON "daily_metrics" USING btree ("metric_date");--> statement-breakpoint
CREATE INDEX "device_obs_device_id_idx" ON "device_observations" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "device_obs_observed_at_idx" ON "device_observations" USING btree ("observed_at");--> statement-breakpoint
CREATE INDEX "devices_mac_address_idx" ON "devices" USING btree ("mac_address");--> statement-breakpoint
CREATE INDEX "devices_ip_address_idx" ON "devices" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "devices_hostname_idx" ON "devices" USING btree ("hostname");--> statement-breakpoint
CREATE INDEX "devices_is_online_idx" ON "devices" USING btree ("is_online");--> statement-breakpoint
CREATE INDEX "devices_last_seen_at_idx" ON "devices" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "notif_deliv_alert_idx" ON "notification_deliveries" USING btree ("alert_event_id");--> statement-breakpoint
CREATE INDEX "notif_deliv_sub_idx" ON "notification_deliveries" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "notif_deliv_status_idx" ON "notification_deliveries" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "push_sub_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "push_sub_user_id_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "router_snapshots_observed_at_idx" ON "router_snapshots" USING btree ("observed_at");--> statement-breakpoint
CREATE INDEX "router_snapshots_status_idx" ON "router_snapshots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "speed_tests_measured_at_idx" ON "speed_tests" USING btree ("measured_at");--> statement-breakpoint
CREATE INDEX "speed_tests_status_idx" ON "speed_tests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "speed_tests_provider_idx" ON "speed_tests" USING btree ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");