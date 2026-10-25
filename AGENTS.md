# AGENTS.md — HomeNet API Conventions

## Core Principles
1. **Separation of Concerns**: Modular NestJS feature modules with clean dependency injection.
2. **Database Integrity**: PostgreSQL with Drizzle ORM. Strictly use migrations via `npm run drizzle:generate` and `npm run drizzle:migrate`. No automatic schema push in production.
3. **Deterministic Incidents**: Low-speed alert state machine enforces breach counts and recovery thresholds independently for download and upload. Never treat a failed test as zero speed.
4. **Hardware Neutrality**: Router integrations adhere to `RouterAdapter`. Never fabricate credentials or query unverified endpoints.
5. **Security**: Helmet, strict CORS, express-rate-limit, parameterized SQL, correlation IDs, safe CSV formula escaping, and JWT token authentication.
