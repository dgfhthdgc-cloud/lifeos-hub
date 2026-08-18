import { JsonDatabaseAdapter } from './database/JsonDatabaseAdapter';
import { DatabaseAdapter } from './database/DatabaseAdapter';

export const db: DatabaseAdapter = new JsonDatabaseAdapter();
export type { DatabaseAdapter };
