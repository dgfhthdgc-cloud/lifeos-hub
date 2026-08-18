import { SqlDatabaseAdapter } from './database/SqlDatabaseAdapter';
import { JsonDatabaseAdapter } from './database/JsonDatabaseAdapter';
import { PostgresDatabaseAdapter } from './database/PostgresDatabaseAdapter';
import { DatabaseAdapter } from './database/DatabaseAdapter';
import { migrateFromJson } from './database/migrator';
import { logger } from './logger';

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
  const requirePostgres = process.env.REQUIRE_POSTGRES === 'true';

  if (isValidPostgresUrl(dbUrl)) {
    try {
      logger.info('DATABASE', 'Connecting to PostgreSQL database cluster...');
      const pgDb = new PostgresDatabaseAdapter();
      await pgDb.initialize();
      logger.info('DATABASE', 'PostgreSQL database connected and schema initialized.');
      activeDb = pgDb;
      return activeDb;
    } catch (err: any) {
      logger.error('DATABASE', 'PostgreSQL connection failed', { error: err?.message });
      if (requirePostgres) {
        throw new Error(
          `FATAL DATABASE ERROR: REQUIRE_POSTGRES is true but connection to PostgreSQL failed: ${err?.message}`
        );
      }
      logger.warn(
        'DATABASE',
        'Falling back to durable SQLite engine. (Note: SQLite is optimized for single-instance container deployments; PostgreSQL is recommended for multi-instance scaling).'
      );
    }
  } else if (dbUrl && dbUrl.trim() !== '') {
    if (requirePostgres) {
      throw new Error(
        'FATAL DATABASE ERROR: REQUIRE_POSTGRES is true but DATABASE_URL is not a valid PostgreSQL connection string.'
      );
    }
    logger.info('DATABASE', 'DATABASE_URL is not a postgres string. Using durable SQLite engine.');
  }

  logger.info('DATABASE', 'Initializing durable SQLite database (.data/lifeos.sqlite)...');
  await sqlDb.initialize();
  logger.info('DATABASE', 'Durable SQLite database initialized with composite indexing and transaction isolation.');

  // Run migration from users.json if present
  try {
    const summary = await migrateFromJson(sqlDb);
    if (summary.usersMigrated > 0) {
      logger.info('DATABASE', `Migrated ${summary.usersMigrated} legacy users into SQLite.`);
    }
  } catch (err: any) {
    logger.warn('DATABASE', 'Legacy migration notice', { error: err?.message });
  }

  activeDb = sqlDb;
  return activeDb;
}

export function getActiveDatabase(): DatabaseAdapter {
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

