import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

import appConfig from './config/app.config';
import { validateEnv } from './config/env.validation';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RouterModule } from './router/router.module';
import { SettingsModule } from './settings/settings.module';
import { AlertsModule } from './alerts/alerts.module';
import { PushModule } from './push/push.module';
import { DevicesModule } from './devices/devices.module';
import { SpeedTestsModule } from './speed-tests/speed-tests.module';
import { NetworkCollectorModule } from './network-collector/network-collector.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    RealtimeModule,
    RouterModule,
    SettingsModule,
    AlertsModule,
    PushModule,
    DevicesModule,
    SpeedTestsModule,
    NetworkCollectorModule,
    ReportsModule,
    DashboardModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
