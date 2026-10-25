import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('HomeNetBootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3001;
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  const frontendOrigin = configService.get<string>('app.frontendOrigin') || 'http://localhost:3000';
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // Helmet security headers
  // CORS configuration - mounted first so all requests and preflights receive CORS headers
  const allowedOrigins = [
    frontendOrigin,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:5173',
    'https://rad-cucurucho-a9ef22.netlify.app',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      const normalizedOrigin = origin?.replace(/\/+$/, '');
      if (
        !origin ||
        nodeEnv !== 'production' ||
        allowedOrigins.includes(origin) ||
        (normalizedOrigin && allowedOrigins.includes(normalizedOrigin)) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.endsWith('.ngrok-free.app') ||
        origin.endsWith('.ngrok.app') ||
        origin.endsWith('.ngrok.io') ||
        origin.endsWith('.ngrok-free.dev') ||
        origin.endsWith('.netlify.app') ||
        (normalizedOrigin && normalizedOrigin.endsWith('.netlify.app')) ||
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Content-Disposition', 'Content-Length', 'x-correlation-id'],
  });

  // Helmet security headers
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Rate limiting to protect against abuse and brute-force
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: nodeEnv === 'production' ? 5000 : 50000,
      skip: (req) => req.method === 'OPTIONS',
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        message: 'Too many requests, please try again later.',
      },
    }),
  );

  // Global API prefix
  app.setGlobalPrefix(apiPrefix);

  // Global DTO validation and transformation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('HomeNet API')
    .setDescription(
      'HomeNet is a personal home Wi-Fi and fiber broadband monitoring, telemetry, and administration dashboard API service.',
    )
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
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token (obtained from POST /api/v1/auth/login)',
      },
      'bearer',
    )
    .addServer(`http://localhost:${port}`, 'Local Development Server')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Serve Swagger UI at /api/docs and /api/v1/docs
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

  SwaggerModule.setup('api/docs', app, document, swaggerCustomOptions);
  SwaggerModule.setup('api/v1/docs', app, document, swaggerCustomOptions);

  // Expose raw OpenAPI JSON at standard endpoints
  const expressApp = app.getHttpAdapter().getInstance();
  const sendSwaggerJson = (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(document);
  };

  expressApp.get('/api/docs-json', sendSwaggerJson);
  expressApp.get('/api/docs.json', sendSwaggerJson);
  expressApp.get('/api/v1/docs-json', sendSwaggerJson);
  expressApp.get('/docs', (req: any, res: any) => res.redirect('/api/docs'));

  await app.listen(port);
  logger.log(`HomeNet Backend is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`Swagger OpenAPI Documentation: http://localhost:${port}/api/docs`);
  logger.log(`Swagger OpenAPI JSON Spec: http://localhost:${port}/api/docs-json`);
}

bootstrap();
