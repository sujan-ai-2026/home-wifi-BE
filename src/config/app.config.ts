import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/homenet',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'homenet_super_secure_jwt_secret_development_only_change_in_production_min32chars',
  speedtestBin: process.env.SPEEDTEST_BIN || 'speedtest',
  speedThresholdMbps: parseFloat(process.env.SPEED_THRESHOLD_MBPS || '10'),
  uploadThresholdMbps: parseFloat(process.env.UPLOAD_THRESHOLD_MBPS || '10'),
  speedTestIntervalMinutes: parseInt(process.env.SPEED_TEST_INTERVAL_MINUTES || '15', 10),
  routerPollIntervalSeconds: parseInt(process.env.ROUTER_POLL_INTERVAL_SECONDS || '60', 10),
  routerAdapter:
    process.env.ROUTER_ADAPTER ||
    (process.env.NODE_ENV === 'production' ? 'unsupported' : 'mock'),
  routerBaseUrl: process.env.ROUTER_BASE_URL || 'http://192.168.1.1',
  routerUsername: process.env.ROUTER_USERNAME || 'admin',
  routerPassword: process.env.ROUTER_PASSWORD || 'admin',
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@homenet.local',
  initialAdminUsername: process.env.INITIAL_ADMIN_USERNAME || 'admin',
  initialAdminPassword: process.env.INITIAL_ADMIN_PASSWORD || 'HomeNetSecurePass123!',
}));
