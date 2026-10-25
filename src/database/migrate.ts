import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/homenet';
  console.log(`[Migration] Connecting to ${connectionString.replace(/:[^:@]+@/, ':****@')}...`);

  const pool = new Pool({
    connectionString,
    max: 1,
  });

  const db = drizzle(pool);

  try {
    const migrationsFolder = path.resolve(__dirname, '../../drizzle');
    console.log(`[Migration] Applying migrations from ${migrationsFolder}...`);
    await migrate(db, { migrationsFolder });
    console.log('[Migration] Migrations applied successfully!');
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

export { runMigrations };
