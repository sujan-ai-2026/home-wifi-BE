"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseProviders = exports.DRIZZLE_ORM = exports.PG_POOL = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pg_1 = require("pg");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const schema = require("./schema");
exports.PG_POOL = 'PG_POOL';
exports.DRIZZLE_ORM = 'DRIZZLE_ORM';
exports.databaseProviders = [
    {
        provide: exports.PG_POOL,
        inject: [config_1.ConfigService],
        useFactory: async (configService) => {
            const logger = new common_1.Logger('DatabasePool');
            const connectionString = configService.get('app.databaseUrl') || process.env.DATABASE_URL;
            const pool = new pg_1.Pool({
                connectionString,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000,
            });
            pool.on('error', (err) => {
                logger.error('Unexpected error on idle PostgreSQL client', err.stack);
            });
            try {
                const client = await pool.connect();
                client.release();
                logger.log('PostgreSQL connection pool established successfully');
            }
            catch (err) {
                logger.error(`Failed to connect to PostgreSQL: ${err.message}`, err.stack);
                throw err;
            }
            return pool;
        },
    },
    {
        provide: exports.DRIZZLE_ORM,
        inject: [exports.PG_POOL],
        useFactory: (pool) => {
            return (0, node_postgres_1.drizzle)(pool, { schema });
        },
    },
];
//# sourceMappingURL=database.provider.js.map