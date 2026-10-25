"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_validation_1 = require("./env.validation");
describe('Environment Validation', () => {
    it('should validate valid environment configuration successfully', () => {
        const config = {
            NODE_ENV: 'development',
            PORT: '3001',
            DATABASE_URL: 'postgresql://localhost:5432/homenet',
            SPEED_THRESHOLD_MBPS: '10',
        };
        const validated = (0, env_validation_1.validateEnv)(config);
        expect(validated.PORT).toBe(3001);
        expect(validated.SPEED_THRESHOLD_MBPS).toBe(10);
        expect(validated.NODE_ENV).toBe('development');
    });
    it('should throw when DATABASE_URL is missing', () => {
        const config = {
            PORT: '3001',
        };
        expect(() => (0, env_validation_1.validateEnv)(config)).toThrow(/Configuration validation error/);
    });
    it('should fail with invalid PORT', () => {
        const config = {
            PORT: 'not-a-number',
            DATABASE_URL: 'postgresql://localhost:5432/homenet',
        };
        expect(() => (0, env_validation_1.validateEnv)(config)).toThrow(/Configuration validation error/);
    });
});
//# sourceMappingURL=env.validation.spec.js.map