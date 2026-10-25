"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
describe('HomeNet API (e2e)', () => {
    let app;
    let jwtToken;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api/v1');
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    describe('/api/v1/health (GET)', () => {
        it('should return 200 OK and healthy database status', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/health')
                .expect(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.dependencies.database.status).toBe('healthy');
        });
    });
    describe('/api/v1/auth/login (POST)', () => {
        it('should authenticate default seeded admin account', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                username: 'admin',
                password: 'HomeNetSecurePass123!',
            })
                .expect(200);
            expect(res.body.accessToken).toBeDefined();
            expect(res.body.user.username).toBe('admin');
            jwtToken = res.body.accessToken;
        });
        it('should reject invalid password', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                username: 'admin',
                password: 'WrongPassword123!',
            })
                .expect(401);
        });
    });
    describe('/api/v1/auth/me (GET)', () => {
        it('should return profile for authenticated user', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${jwtToken}`)
                .expect(200);
            expect(res.body.username).toBe('admin');
            expect(res.body.role).toBe('admin');
        });
        it('should reject unauthenticated request', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/auth/me')
                .expect(401);
        });
    });
    describe('/api/v1/speed-tests/run (POST)', () => {
        it('should execute a speed test and record outcome', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/speed-tests/run')
                .expect(200);
            expect(res.body.status).toBe('success');
            expect(res.body.downloadMbps).toBeGreaterThan(0);
            expect(res.body.uploadMbps).toBeGreaterThan(0);
        });
    });
    describe('/api/v1/speed-tests/latest (GET)', () => {
        it('should retrieve latest measurement and freshness status', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/speed-tests/latest')
                .expect(200);
            expect(res.body.latestSuccessful).toBeDefined();
            expect(res.body.latestSuccessful.downloadMbps).toBeGreaterThan(0);
            expect(res.body.isStale).toBe(false);
        });
    });
    describe('/api/v1/speed-tests/history (GET)', () => {
        it('should return paginated history', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/speed-tests/history?page=1&limit=10')
                .expect(200);
            expect(res.body.items).toBeInstanceOf(Array);
            expect(res.body.meta.totalItems).toBeGreaterThanOrEqual(1);
        });
    });
    describe('/api/v1/dashboard/overview (GET)', () => {
        it('should return aggregated overview metrics', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/dashboard/overview')
                .expect(200);
            expect(res.body.internetHealthState).toBeDefined();
            expect(res.body.latestSuccessful).toBeDefined();
            expect(res.body.activeLowSpeedIncidents).toBeDefined();
        });
    });
    describe('/api/v1/devices (GET)', () => {
        it('should return list of network devices', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/devices')
                .expect(200);
            expect(res.body.items).toBeInstanceOf(Array);
            expect(res.body.meta).toBeDefined();
        });
    });
    describe('/api/v1/settings (GET and PATCH)', () => {
        it('should return app settings', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/settings')
                .expect(200);
            expect(res.body.downloadThresholdMbps).toBeDefined();
            expect(res.body.uploadThresholdMbps).toBeDefined();
        });
        it('should update app settings when authenticated', async () => {
            const res = await request(app.getHttpServer())
                .patch('/api/v1/settings')
                .set('Authorization', `Bearer ${jwtToken}`)
                .send({
                downloadThresholdMbps: 15,
            })
                .expect(200);
            expect(res.body.downloadThresholdMbps).toBe(15);
        });
    });
    describe('/api/v1/reports/monthly (GET)', () => {
        it('should calculate monthly report', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/reports/monthly?month=2026-10')
                .expect(200);
            expect(res.body.month).toBe('2026-10');
            expect(res.body.totalSuccessfulTests).toBeGreaterThanOrEqual(1);
            expect(res.body.averageDownloadMbps).toBeGreaterThan(0);
        });
    });
    describe('/api/v1/reports/export (GET)', () => {
        it('should export monthly CSV', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/reports/export?month=2026-10')
                .expect(200);
            expect(res.headers['content-type']).toContain('text/csv');
            expect(res.text).toContain('Timestamp (UTC)');
        });
    });
    describe('/api/v1/push/status (GET)', () => {
        it('should return push notification status', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/push/status')
                .expect(200);
            expect(res.body).toHaveProperty('configured');
        });
    });
});
//# sourceMappingURL=app.e2e-spec.js.map