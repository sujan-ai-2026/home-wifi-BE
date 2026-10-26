"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const express_rate_limit_1 = require("express-rate-limit");
const app_module_1 = require("./app.module");
const cors_1 = require("./config/cors");
async function bootstrap() {
    const logger = new common_1.Logger('HomeNetBootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug'],
    });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('app.port') || 3001;
    const apiPrefix = configService.get('app.apiPrefix') || 'api/v1';
    const frontendOrigin = configService.get('app.frontendOrigin') || 'http://localhost:3000';
    const nodeEnv = configService.get('app.nodeEnv') || 'development';
    app.enableShutdownHooks();
    const allowedOrigins = (0, cors_1.getAllowedOrigins)(frontendOrigin);
    app.enableCors({
        origin: (origin, callback) => {
            callback(null, (0, cors_1.isCorsOriginAllowed)(origin, allowedOrigins, nodeEnv));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        exposedHeaders: ['Content-Disposition', 'Content-Length', 'x-correlation-id'],
    });
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
        crossOriginEmbedderPolicy: false,
    }));
    app.use((0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: nodeEnv === 'production' ? 5000 : 50000,
        skip: (req) => req.method === 'OPTIONS',
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            statusCode: 429,
            message: 'Too many requests, please try again later.',
        },
    }));
    app.setGlobalPrefix(apiPrefix);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('HomeNet API')
        .setDescription('HomeNet is a personal home Wi-Fi and fiber broadband monitoring, telemetry, and administration dashboard API service.')
        .setVersion('1.0.0')
        .addTag('dashboard', 'Real-time telemetry, network overview, and health status')
        .addTag('speed-tests', 'Scheduled and on-demand Ookla speed tests and measurement history')
        .addTag('devices', 'Discovered network devices, MAC deduplication, and observation history')
        .addTag('alerts', 'Low-speed incident engine, state machine, and breach confirmations')
        .addTag('reports', 'Monthly performance summaries, daily rollups, and safe CSV export')
        .addTag('settings', 'Configurable monitoring thresholds, intervals, and data retention')
        .addTag('push', 'Web Push VAPID subscriptions and delivery logging')
        .addTag('auth', 'Dashboard owner authentication and JWT token management')
        .addTag('health', 'Liveness and database connection probes')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token (obtained from POST /api/v1/auth/login)',
    }, 'bearer')
        .addServer(`http://localhost:${port}`, 'Local Development Server')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    const swaggerCustomOptions = {
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            docExpansion: 'list',
            tryItOutEnabled: true,
        },
        customSiteTitle: 'HomeNet API — OpenAPI Documentation',
        customCss: `
      .swagger-ui .topbar { background-color: #090d16; border-bottom: 1px solid #1e293b; }
      .swagger-ui .topbar .topbar-wrapper .link { color: #38bdf8; font-weight: 700; font-size: 1.2rem; }
      .swagger-ui .info .title { color: #0284c7; }
      .swagger-ui .scheme-container { background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    `,
    };
    swagger_1.SwaggerModule.setup('api/docs', app, document, swaggerCustomOptions);
    swagger_1.SwaggerModule.setup('api/v1/docs', app, document, swaggerCustomOptions);
    const expressApp = app.getHttpAdapter().getInstance();
    const sendSwaggerJson = (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.json(document);
    };
    expressApp.get('/api/docs-json', sendSwaggerJson);
    expressApp.get('/api/docs.json', sendSwaggerJson);
    expressApp.get('/api/v1/docs-json', sendSwaggerJson);
    expressApp.get('/docs', (req, res) => res.redirect('/api/docs'));
    await app.listen(port);
    logger.log(`HomeNet Backend is running on: http://localhost:${port}/${apiPrefix}`);
    logger.log(`Swagger OpenAPI Documentation: http://localhost:${port}/api/docs`);
    logger.log(`Swagger OpenAPI JSON Spec: http://localhost:${port}/api/docs-json`);
}
bootstrap();
//# sourceMappingURL=main.js.map