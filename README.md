# HomeNet API — Backend Service

HomeNet API is the backend monitoring and administration service for home Wi-Fi and fiber broadband connections (specifically tailored for home networks running on Airtel Xstream Fiber gateways and always-on home servers).

## Features
- **Deterministic Low-Speed Incident Engine**: Evaluates download & upload breaches independently with configurable breach & recovery thresholds.
- **Scheduled & On-Demand Speed Tests**: Runs fixed-argument CLI speed tests (`execFile`) or fallback simulation, safely sanitizing output and never representing failed tests as zero speed.
- **Router Telemetry & Boundary**: Clear `RouterAdapter` boundary with `MockRouterAdapter` and `AirtelRouterAdapter` with strict SSRF defense.
- **Device Management & Deduplication**: Normalizes MAC addresses and preserves physical identity across MAC randomization and IP renewal.
- **Web Push Notifications**: Standard VAPID push notifications with delivery attempt logging and automatic expired endpoint cleanup.
- **Reporting & Idempotent Daily Rollups**: Monthly metrics calculation and safe formula-injection-resistant CSV export.
- **Real-Time WebSocket Gateway**: Emits typed Socket.IO events (`speed-test.updated`, `internet-health.updated`, `devices.updated`, `alert.created`, `alert.resolved`).
- **Production Hardened**: Parameterized queries via Drizzle ORM, Helmet security headers, rate limiting, correlation IDs, and JWT authentication.

---

## Getting Started

### Prerequisites
- Node.js >= 20
- PostgreSQL >= 15
- (Optional) Ookla Speedtest CLI (`speedtest`)

### Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` points to your PostgreSQL database.

### Running Migrations
HomeNet uses a migrations-first workflow (never automatic sync or production schema push):
```bash
npm run drizzle:generate
npm run drizzle:migrate
```

### Running Locally
```bash
# Development mode with hot-reload
npm run start:dev

# Production build and run
npm run build
npm run start:prod
```

The API will be available at:
- **REST Endpoints**: `http://localhost:3001/api/v1`
- **Swagger Documentation**: `http://localhost:3001/api/docs`
- **Socket.IO Gateway**: `ws://localhost:3001`

---

## API Summary

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service and database connectivity check |
| `POST` | `/api/v1/auth/login` | Authenticate dashboard owner |
| `GET` | `/api/v1/auth/me` | Authenticated profile |
| `GET` | `/api/v1/dashboard/overview` | Aggregated telemetry, health state, and latest speeds |
| `GET` | `/api/v1/speed-tests/latest` | Latest measurement, attempt info, and freshness |
| `GET` | `/api/v1/speed-tests/history` | Paginated speed test records with date filters |
| `POST` | `/api/v1/speed-tests/run` | Trigger on-demand speed test |
| `GET` | `/api/v1/devices` | Discovered and historical devices |
| `GET` | `/api/v1/devices/:id/history` | Device online/offline observation history |
| `GET` | `/api/v1/alerts` | Low-speed incident events |
| `GET` | `/api/v1/settings` | Current thresholds and poll intervals |
| `PATCH`| `/api/v1/settings` | Update thresholds and poll intervals |
| `GET` | `/api/v1/reports/monthly` | Aggregated monthly performance summary |
| `GET` | `/api/v1/reports/export` | Formula-injection-resistant CSV export |
| `POST` | `/api/v1/push/subscribe` | Register Web Push subscription |
| `GET` | `/api/v1/push/status` | VAPID status and public key |

---

## Airtel Xstream Fiber Integration
Airtel gateways utilize diverse hardware variants (e.g., Nokia, ZTE, Syrotech, Huawei).
The backend provides a strict separation boundary:
1. `MockRouterAdapter`: Used for development and testing.
2. `AirtelRouterAdapter`: Strictly verifies router presence, enforces private network SSRF rules, and avoids guessing unverified APIs. If the specific gateway model protocol is unverified, it reports `unsupported` or `not_configured` without returning fake devices or counters.

---

## Docker Deployment
```bash
docker compose up -d --build
```
This runs PostgreSQL on an internal isolated Docker network and exposes the HomeNet API on port 3001.

---

## Running Automated Tests
```bash
# Unit tests
npm test

# End-to-end integration tests
npm run test:e2e
```
