import { Provider } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
export declare const PG_POOL = "PG_POOL";
export declare const DRIZZLE_ORM = "DRIZZLE_ORM";
export type DrizzleDb = NodePgDatabase<typeof schema>;
export declare const databaseProviders: Provider[];
