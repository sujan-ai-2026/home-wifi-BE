# HomeNet API — Backend Service

HomeNet API is the backend monitoring and administration service for home Wi-Fi and fiber broadband connections (specifically tailored for home networks running on Airtel Xstream Fiber gateways and always-on home servers).

## Features
- **Deterministic Low-Speed Incident Engine**: Evaluates download & upload breaches independently with configurable breach & recovery thresholds.
- **Scheduled & On-Demand Speed Tests**: Runs fixed-argument CLI speed tests (`execFile`) and records missing binaries as failures instead of simulated measurements.
- **Router Telemetry & Boundary**: Clear `RouterAdapter` boundary with `MockRouterAdapter` and `AirtelRouterAdapter` with strict SSRF defense.
- **Device Management & Deduplication**: Normalizes MAC addresses and preserves physical identity across MAC randomization and IP renewal.
- **Web Push Notifications**: Standard VAPID push notifications with delivery attempt logging and automatic expired endpoint cleanup.
- **Reporting & Idempotent Daily Rollups**: Monthly metrics calculation and safe formula-injection-resistant CSV export.
- **Real-Time WebSocket Gateway**: Emits typed Socket.IO events (`speed-test.updated`, `internet-health.updated`, `devices.updated`, `alert.created`, `alert.resolved`).
- **Live Device Data**: `GET /api/v1/devices/live` and `devices.updated` WebSocket events return current router observations; synthetic device records and estimated traffic values are excluded.
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
- **Socket.IO Gateway**: `http://localhost:3001` (Socket.IO's default `/socket.io` transport path)

### Realtime Frontend Connection
Connect the frontend to the API host, not the REST API prefix or a `/realtime` path:
```ts
const socket = io('http://localhost:3001', { withCredentials: true });

socket.on('devices.updated', (data) => { /* current connected-device snapshot */ });
socket.on('devices.list.updated', (data) => { /* current device list */ });
socket.on('internet-health.updated', (data) => { /* internet reachability and freshness */ });
socket.on('speed-test.updated', (data) => { /* result of an on-demand or scheduled test */ });
```

The production frontend origin must be included in `FRONTEND_ORIGIN` (comma-separated for
multiple origins). Events are broadcasts; fetch the REST overview/history endpoints on
initial page load rather than expecting a replay of events sent before the client connected.

### Real Speed-Test Prerequisite
The backend runs the Ookla Speedtest CLI specified by `SPEEDTEST_BIN` (default: `speedtest`).
The Docker image installs the official CLI from Ookla's signed Debian package repository.
For a host-run API, install the official CLI on that host and verify it with
`speedtest --version`. The backend does not synthesize measurements when the binary is missing:
the attempt is stored as failed with `SPEEDTEST_NOT_INSTALLED`, and `speed-test.updated` reports
a failed result with null speed values.

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
| `GET` | `/api/v1/devices/live` | Current device observations from the active router adapter |
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
The Airtel adapter refreshes the LAN ARP table and reports complete neighbor entries without relying on ICMP replies, which many phones and other clients block. On Linux, failed and incomplete kernel neighbor probes are excluded so stale ARP entries do not keep disconnected devices online. Device activity history records status transitions instead of every polling sample, with a 30-second offline grace period. It also includes the API host by its operating-system hostname when it is on the router subnet. A host-run Linux API can resolve advertised hostnames through Avahi when its system bus and Avahi service are available. Devices that hide their hostname and use a private/randomized MAC remain identified by IP; neither the MAC nor an ARP observation can reliably reveal whether that client is an iPhone, iPad, Mac, or whether it uses Wi-Fi versus Ethernet. The adapter reports connection type as unknown unless the router provides that association data. Accurate client names and link types require a verified router client/lease API. Docker Desktop isolates containers from the host's physical LAN neighbor table. On a native Linux Docker engine, use the host-network override:
```bash
docker compose -f docker-compose.yml -f docker-compose.lan.yml up -d --build
```
On Docker Desktop, run the API on the Linux host and leave PostgreSQL and the tunnel in Docker:
```bash
docker compose up -d postgres
npm run build
```
Install the host API service and its Docker tunnel proxy:
```bash
docker rm -f homenet-api
docker compose -f docker-compose.yml -f docker-compose.desktop-host-api.yml up -d postgres api-tunnel-proxy
systemctl --user link "$PWD/deploy/homenet-api.service"
systemctl --user daemon-reload
systemctl --user enable --now homenet-api.service
```
The service reads the existing `.env` for application secrets and binds to the host's Wi-Fi network; it uses the Compose PostgreSQL port (`127.0.0.1:5433`) and the configured router HTTPS URL. The overlay keeps the ngrok tunnel's `api` alias pointed at the host API. Rebuild and restart after code changes with `npm run build && systemctl --user restart homenet-api.service`. Do not use plain `docker compose up` in this Docker Desktop setup: that would start the isolated API container and conflict with the host API on port 3001. Router WAN state, uptime, and traffic counters still require a verified router API protocol; the adapter does not fabricate those values.

---

## Running Automated Tests
```bash
# Unit tests
npm test

# End-to-end integration tests
npm run test:e2e
```
