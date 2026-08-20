import { SqlDatabaseAdapter } from './database/SqlDatabaseAdapter';
import { JsonDatabaseAdapter } from './database/JsonDatabaseAdapter';
import { PostgresDatabaseAdapter } from './database/PostgresDatabaseAdapter';
import { DatabaseAdapter } from './database/DatabaseAdapter';
import { migrateFromJson } from './database/migrator';
import { logger } from './logger';

export const sqlDb = new SqlDatabaseAdapter();
export const jsonDb = new JsonDatabaseAdapter();

let activeDb: DatabaseAdapter = sqlDb;

export function sanitizeDatabaseUrl(urlStr?: string | null): string {
  if (!urlStr) return '[NONE]';
  try {
    const parsed = new URL(urlStr);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return '[INVALID_URL]';
  }
}

export function isValidPostgresUrl(urlStr: string | undefined | null): boolean {
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
  const isMultiInstance =
    process.env.STORAGE_MODE === 'multi-instance' ||
    process.env.DEPLOYMENT_MODE === 'multi_instance' ||
    process.env.MULTI_INSTANCE === 'true' ||
    process.env.CLUSTER_MODE === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  if ((requirePostgres || isMultiInstance) && !isValidPostgresUrl(dbUrl)) {
    throw new Error(
      'FATAL DATABASE CONFIGURATION: Multi-instance or REQUIRE_POSTGRES is active but DATABASE_URL is missing or not a valid PostgreSQL connection string. SQLite is strictly single-instance only.'
    );
  }

  if (isValidPostgresUrl(dbUrl)) {
    try {
      logger.info('DATABASE', `Connecting to PostgreSQL cluster: ${sanitizeDatabaseUrl(dbUrl)}`);
      const pgDb = new PostgresDatabaseAdapter();
      await pgDb.initialize();
      logger.info('DATABASE', 'PostgreSQL database connected and schema verified.');
      activeDb = pgDb;
      return activeDb;
    } catch (err: any) {
      logger.error('DATABASE', 'PostgreSQL connection failed', {
        sanitizedUrl: sanitizeDatabaseUrl(dbUrl),
      });

      if (requirePostgres || isMultiInstance || (isProduction && process.env.ALLOW_SQLITE_FALLBACK !== 'true')) {
        throw new Error(
          'FATAL DATABASE ERROR: PostgreSQL connection failed and SQLite fallback is disallowed in this configuration.'
        );
      }

      logger.warn(
        'DATABASE',
        'Falling back to durable SQLite engine. (Note: SQLite is optimized for development and single-instance container deployments).'
      );
    }
  } else if (dbUrl && dbUrl.trim() !== '') {
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
    logger.warn('DATABASE', 'Legacy migration notice');
  }

  activeDb = sqlDb;
  return activeDb;
}

export function getActiveDatabase(): DatabaseAdapter {
  return activeDb;
}

export function setActiveDatabase(newDb: DatabaseAdapter): void {
  activeDb = newDb;
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
