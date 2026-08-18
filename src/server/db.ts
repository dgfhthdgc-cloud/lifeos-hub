import { SqlDatabaseAdapter } from './database/SqlDatabaseAdapter';
import { JsonDatabaseAdapter } from './database/JsonDatabaseAdapter';
import { PostgresDatabaseAdapter } from './database/PostgresDatabaseAdapter';
import { DatabaseAdapter } from './database/DatabaseAdapter';
import { migrateFromJson } from './database/migrator';

export const sqlDb = new SqlDatabaseAdapter();
export const jsonDb = new JsonDatabaseAdapter();

let activeDb: DatabaseAdapter = sqlDb;

function isValidPostgresUrl(urlStr: string | undefined): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim();
  if (!trimmed.startsWith('postgres://') && !trimmed.startsWith('postgresql://')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return !!parsed.hostname && parsed.hostname !== 'base' && !parsed.hostname.includes(' ');
  } catch {
    return false;
  }
}

export async function initDatabase(): Promise<DatabaseAdapter> {
  const dbUrl = process.env.DATABASE_URL;
  if (isValidPostgresUrl(dbUrl)) {
    try {
      console.log('[Database] Connecting to PostgreSQL database...');
      const pgDb = new PostgresDatabaseAdapter();
      await pgDb.initialize();
      console.log('[Database] Connected to PostgreSQL successfully.');
      activeDb = pgDb;
      return activeDb;
    } catch (err: any) {
      console.warn('[Database] PostgreSQL connection failed, falling back to durable SQLite:', err?.message);
    }
  } else if (dbUrl && dbUrl.trim() !== '') {
    console.log('[Database] DATABASE_URL is not a valid postgres connection string. Using durable SQLite.');
  }

  console.log('[Database] Initializing durable SQLite database...');
  await sqlDb.initialize();
  console.log('[Database] Durable SQLite database initialized at .data/lifeos.sqlite');

  // Run migration from users.json if present
  try {
    const summary = await migrateFromJson(sqlDb);
    if (summary.usersMigrated > 0) {
      console.log(`[Database Migration] Imported ${summary.usersMigrated} users from .data/users.json into SQLite.`);
    }
  } catch (err: any) {
    console.warn('[Database Migration] users.json import notice:', err?.message);
  }

  activeDb = sqlDb;
  return activeDb;
}

// Proxy wrapper so synchronous route calls resolve to activeDb dynamically
export const db: DatabaseAdapter = new Proxy({} as DatabaseAdapter, {
  get(_target, prop) {
    const val = (activeDb as any)[prop];
    if (typeof val === 'function') {
      return val.bind(activeDb);
    }
    return val;
  },
});

export type { DatabaseAdapter };
