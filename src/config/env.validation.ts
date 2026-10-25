import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  API_PREFIX: z.string().default('api/v1'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('homenet_super_secure_jwt_secret_development_only_change_in_production_min32chars'),
  SPEEDTEST_BIN: z.string().default('speedtest'),
  SPEED_THRESHOLD_MBPS: z.coerce.number().positive().default(10),
  UPLOAD_THRESHOLD_MBPS: z.coerce.number().positive().default(10),
  SPEED_TEST_INTERVAL_MINUTES: z.coerce.number().positive().default(15),
  ROUTER_POLL_INTERVAL_SECONDS: z.coerce.number().positive().default(60),
  ROUTER_ADAPTER: z.enum(['mock', 'airtel', 'unsupported']).default('mock'),
  ROUTER_BASE_URL: z.string().url().default('http://192.168.1.1'),
  ROUTER_USERNAME: z.string().optional().default('admin'),
  ROUTER_PASSWORD: z.string().optional().default('admin'),
  VAPID_PUBLIC_KEY: z.string().optional().default(''),
  VAPID_PRIVATE_KEY: z.string().optional().default(''),
  VAPID_SUBJECT: z.string().optional().default('mailto:admin@homenet.local'),
  INITIAL_ADMIN_USERNAME: z.string().default('admin'),
  INITIAL_ADMIN_PASSWORD: z.string().default('HomeNetSecurePass123!'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errorMessages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Configuration validation error: ${errorMessages}`);
  }
  return result.data;
}
