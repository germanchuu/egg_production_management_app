/**
 * Database Module Entry Point
 *
 * Centralized exports for all database functionality.
 *
 * Usage:
 * ```typescript
 * import { initDatabase, getDatabase, executeQuery } from '@/shared/database';
 *
 * // Initialize at app startup
 * await initDatabase();
 *
 * // Use throughout the app
 * const db = getDatabase();
 * const users = await executeQuery<User>('SELECT * FROM users');
 * ```
 */

// Database initialization and management
export {
  initDatabase,
  getDatabase,
  closeDatabase,
} from './SQLiteDatabase';

// Query execution helpers
export {
  executeQuery,
  executeQueryFirst,
  executeStatement,
  executeTransaction,
} from './SQLiteDatabase';

// Development utilities
export {
  dropAllTables,
} from './SQLiteDatabase';

// Schema utilities
export {
  getSchemaSQL,
  getSchemaVersion,
  SCHEMA_VERSION,
} from './schema';
