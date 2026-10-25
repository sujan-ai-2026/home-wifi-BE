"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(3001),
    API_PREFIX: zod_1.z.string().default('api/v1'),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    FRONTEND_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    JWT_SECRET: zod_1.z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('homenet_super_secure_jwt_secret_development_only_change_in_production_min32chars'),
    SPEEDTEST_BIN: zod_1.z.string().default('speedtest'),
    SPEED_THRESHOLD_MBPS: zod_1.z.coerce.number().positive().default(10),
    UPLOAD_THRESHOLD_MBPS: zod_1.z.coerce.number().positive().default(10),
    SPEED_TEST_INTERVAL_MINUTES: zod_1.z.coerce.number().positive().default(15),
    ROUTER_POLL_INTERVAL_SECONDS: zod_1.z.coerce.number().positive().default(60),
    ROUTER_ADAPTER: zod_1.z.enum(['mock', 'airtel', 'unsupported']).default('mock'),
    ROUTER_BASE_URL: zod_1.z.string().url().default('http://192.168.1.1'),
    ROUTER_USERNAME: zod_1.z.string().optional().default('admin'),
    ROUTER_PASSWORD: zod_1.z.string().optional().default('admin'),
    VAPID_PUBLIC_KEY: zod_1.z.string().optional().default(''),
    VAPID_PRIVATE_KEY: zod_1.z.string().optional().default(''),
    VAPID_SUBJECT: zod_1.z.string().optional().default('mailto:admin@homenet.local'),
    INITIAL_ADMIN_USERNAME: zod_1.z.string().default('admin'),
    INITIAL_ADMIN_PASSWORD: zod_1.z.string().default('HomeNetSecurePass123!'),
});
function validateEnv(config) {
    const result = exports.envSchema.safeParse(config);
    if (!result.success) {
        const errorMessages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Configuration validation error: ${errorMessages}`);
    }
    return result.data;
}
//# sourceMappingURL=env.validation.js.map