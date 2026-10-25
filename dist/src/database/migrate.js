"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const pg_1 = require("pg");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const migrator_1 = require("drizzle-orm/node-postgres/migrator");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();
async function runMigrations() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/homenet';
    console.log(`[Migration] Connecting to ${connectionString.replace(/:[^:@]+@/, ':****@')}...`);
    const pool = new pg_1.Pool({
        connectionString,
        max: 1,
    });
    const db = (0, node_postgres_1.drizzle)(pool);
    try {
        const migrationsFolder = path.resolve(__dirname, '../../drizzle');
        console.log(`[Migration] Applying migrations from ${migrationsFolder}...`);
        await (0, migrator_1.migrate)(db, { migrationsFolder });
        console.log('[Migration] Migrations applied successfully!');
    }
    catch (error) {
        console.error('[Migration] Migration failed:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
if (require.main === module) {
    runMigrations();
}
//# sourceMappingURL=migrate.js.map