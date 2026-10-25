import { Provider, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const PG_POOL = 'PG_POOL';
export const DRIZZLE_ORM = 'DRIZZLE_ORM';

export type DrizzleDb = NodePgDatabase<typeof schema>;

export const databaseProviders: Provider[] = [
  {
    provide: PG_POOL,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const logger = new Logger('DatabasePool');
      const connectionString = configService.get<string>('app.databaseUrl') || process.env.DATABASE_URL;

      const pool = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      pool.on('error', (err) => {
        logger.error('Unexpected error on idle PostgreSQL client', err.stack);
      });

      // Verify connection once at startup
      try {
        const client = await pool.connect();
        client.release();
        logger.log('PostgreSQL connection pool established successfully');
      } catch (err: any) {
        logger.error(`Failed to connect to PostgreSQL: ${err.message}`, err.stack);
        throw err;
      }

      return pool;
    },
  },
  {
    provide: DRIZZLE_ORM,
    inject: [PG_POOL],
    useFactory: (pool: Pool): DrizzleDb => {
      return drizzle(pool, { schema });
    },
  },
];
