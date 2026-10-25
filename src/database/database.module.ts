import { Module, Global, OnApplicationShutdown, Inject, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { databaseProviders, PG_POOL, DRIZZLE_ORM } from './database.provider';

@Global()
@Module({
  providers: [...databaseProviders],
  exports: [PG_POOL, DRIZZLE_ORM],
})
export class DatabaseModule implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Closing PostgreSQL connection pool on ${signal || 'shutdown'}...`);
    await this.pool.end();
    this.logger.log('PostgreSQL connection pool closed.');
  }
}
