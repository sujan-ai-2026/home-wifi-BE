# AGENTS.md — HomeNet Backend Implementation Conventions

## Project Overview
HomeNet is a personal home Wi-Fi monitoring and administration dashboard.
This repository hosts the backend API service (`homenet-api`), providing network telemetry, scheduled speed testing, router telemetry collection, low-speed incident detection, Web Push notifications, monthly reporting, and real-time WebSocket events.

## Architecture
- **Framework**: NestJS with TypeScript (strict mode)
- **Database**: PostgreSQL with Drizzle ORM and Drizzle Kit (migrations-first workflow)
- **Real-time**: Socket.IO Gateway on `/realtime`
- **Background Jobs**: NestJS `@nestjs/schedule` for speed tests, router polling, and daily rollups
- **Security**: Helmet, strict CORS, rate limiting, JWT authentication, parameterized SQL, execFile with argument whitelisting
- **API Prefix**: `/api/v1`
- **Swagger/OpenAPI**: Enabled at `/api/docs`

## Directory Structure
- `homenet-api/src/config/`: Validated environment configuration via Zod / class-validator
- `homenet-api/src/database/`: PostgreSQL connection pool, schema, migrations, and Drizzle provider
- `homenet-api/src/auth/`: JWT authentication and owner security
- `homenet-api/src/dashboard/`: System and internet overview aggregation
- `homenet-api/src/speed-tests/`: Speed test executor, providers, scheduler, and history
- `homenet-api/src/router/`: RouterAdapter interface, MockAdapter, AirtelAdapter boundary
- `homenet-api/src/network-collector/`: Probe targets, latency/WAN monitoring
- `homenet-api/src/devices/`: Connected devices inventory, normalization, and observation history
- `homenet-api/src/alerts/`: Low-speed incident state machine, breach confirmation, and resolution
- `homenet-api/src/push/`: Web Push VAPID subscriptions and delivery logging
- `homenet-api/src/reports/`: Daily aggregation and monthly summaries with safe CSV export
- `homenet-api/src/settings/`: Configurable thresholds and intervals
- `homenet-api/src/realtime/`: Socket.IO gateway with typed events
- `homenet-api/src/health/`: Liveness and readiness endpoints

## Development Commands
```bash
cd homenet-api
npm install
npm run build
npm run test
npm run migration:generate
npm run migration:run
npm run start:dev
```
