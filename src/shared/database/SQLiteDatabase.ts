/**
 * SQLite Database Manager
 *
 * Handles database initialization, migrations, and provides helper functions
 * for executing queries using expo-sqlite.
 *
 * Usage:
 * ```typescript
 * import { initDatabase, getDatabase } from '@/shared/database/SQLiteDatabase';
 *
 * // Initialize database (call once at app startup)
 * await initDatabase();
 *
 * // Get database instance for queries
 * const db = await getDatabase();
 * const result = await db.getAllAsync('SELECT * FROM users');
 * ```
 */

import * as SQLite from 'expo-sqlite';
import { getSchemaSQL, getSchemaVersion } from './schema';

const DATABASE_NAME = 'poultry_production.db';
const SCHEMA_VERSION_KEY = 'schema_version';

let databaseInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Opens the SQLite database
 *
 * @returns SQLite database instance
 */
async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  try {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    console.log('✅ Database opened successfully:', DATABASE_NAME);
    return db;
  } catch (error) {
    console.error('❌ Failed to open database:', error);
    throw new Error(`Failed to open database: ${error}`);
  }
}

/**
 * Gets current schema version from database
 *
 * @param db Database instance
 * @returns Current schema version or 0 if not set
 */
async function getCurrentSchemaVersion(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  try {
    // Check if pragma table exists (it should always exist)
    const result = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );

    return result?.user_version ?? 0;
  } catch (error) {
    console.warn('⚠️ Could not read schema version, assuming 0:', error);
    return 0;
  }
}

/**
 * Sets schema version in database
 *
 * @param db Database instance
 * @param version Schema version to set
 */
async function setSchemaVersion(
  db: SQLite.SQLiteDatabase,
  version: number
): Promise<void> {
  try {
    await db.execAsync(`PRAGMA user_version = ${version}`);
    console.log(`✅ Schema version set to ${version}`);
  } catch (error) {
    console.error('❌ Failed to set schema version:', error);
    throw error;
  }
}

/**
 * Runs database migrations
 *
 * Executes schema SQL statements to create or update database structure.
 *
 * @param db Database instance
 * @param currentVersion Current schema version
 * @param targetVersion Target schema version
 */
async function runMigrations(
  db: SQLite.SQLiteDatabase,
  currentVersion: number,
  targetVersion: number
): Promise<void> {
  console.log(
    `🔄 Running migrations from version ${currentVersion} to ${targetVersion}...`
  );

  try {
    if (currentVersion === 0) {
      // Fresh install - create all tables and indexes
      console.log('📦 Fresh install detected, creating schema...');

      const schemaSQL = getSchemaSQL();

      // Execute all schema statements in a transaction for atomicity
      await db.withTransactionAsync(async () => {
        for (const sql of schemaSQL) {
          await db.execAsync(sql);
        }
      });

      console.log(
        `✅ Schema created successfully (${schemaSQL.length} statements executed)`
      );
    } else if (currentVersion < targetVersion) {
      // Future migrations will go here
      console.log(
        `⚠️ Migration from version ${currentVersion} to ${targetVersion} not implemented yet`
      );
      // Example for future migrations:
      // if (currentVersion === 1 && targetVersion === 2) {
      //   await db.execAsync('ALTER TABLE users ADD COLUMN new_field TEXT');
      // }
    } else {
      console.log('✅ Database schema is up to date');
    }

    // Update schema version
    await setSchemaVersion(db, targetVersion);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw new Error(`Migration failed: ${error}`);
  }
}

/**
 * Initializes the database
 *
 * Opens the database connection, runs migrations if needed, and sets up
 * the database instance for use throughout the app.
 *
 * This should be called once during app startup before any database operations.
 *
 * @returns Promise that resolves when database is ready
 */
export async function initDatabase(): Promise<void> {
  try {
    console.log('🚀 Initializing database...');

    // Open database connection
    const db = await openDatabase();

    // Enable foreign key constraints (disabled by default in SQLite)
    await db.execAsync('PRAGMA foreign_keys = ON');
    console.log('✅ Foreign key constraints enabled');

    // Check current schema version
    const currentVersion = await getCurrentSchemaVersion(db);
    const targetVersion = getSchemaVersion();

    console.log(`📊 Schema version: ${currentVersion} (target: ${targetVersion})`);

    // Run migrations if needed
    if (currentVersion !== targetVersion) {
      await runMigrations(db, currentVersion, targetVersion);
    } else {
      console.log('✅ Database schema is up to date');
    }

    // Store database instance for reuse
    databaseInstance = db;

    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Gets the database instance
 *
 * Returns the initialized database instance. Throws error if database
 * has not been initialized yet.
 *
 * @returns Database instance
 * @throws Error if database not initialized
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databaseInstance) {
    throw new Error(
      'Database not initialized. Call initDatabase() first during app startup.'
    );
  }

  return databaseInstance;
}

/**
 * Closes the database connection
 *
 * Should be called during app cleanup (rarely needed).
 */
export async function closeDatabase(): Promise<void> {
  if (databaseInstance) {
    try {
      await databaseInstance.closeAsync();
      databaseInstance = null;
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Failed to close database:', error);
      throw error;
    }
  }
}

/**
 * Executes a raw SQL query with parameters
 *
 * Helper function for executing SQL queries with proper error handling.
 *
 * @param sql SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export async function executeQuery<T>(
  sql: string,
  params?: SQLite.SQLiteBindParams
): Promise<T[]> {
  const db = await getDatabase();

  try {
    const result = await db.getAllAsync<T>(sql, params);
    return result;
  } catch (error) {
    console.error('❌ Query execution failed:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Executes a query that returns a single row
 *
 * @param sql SQL query string
 * @param params Query parameters
 * @returns Single row result or null
 */
export async function executeQueryFirst<T>(
  sql: string,
  params?: SQLite.SQLiteBindParams
): Promise<T | null> {
  const db = await getDatabase();

  try {
    const result = await db.getFirstAsync<T>(sql, params);
    return result;
  } catch (error) {
    console.error('❌ Query execution failed:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Executes an INSERT/UPDATE/DELETE query
 *
 * @param sql SQL statement
 * @param params Statement parameters
 * @returns Result with lastInsertRowId and changes count
 */
export async function executeStatement(
  sql: string,
  params?: SQLite.SQLiteBindParams
): Promise<SQLite.SQLiteRunResult> {
  const db = await getDatabase();

  try {
    const result = await db.runAsync(sql, params);
    return result;
  } catch (error) {
    console.error('❌ Statement execution failed:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Executes multiple statements in a transaction
 *
 * Ensures atomicity - all statements succeed or all fail.
 *
 * @param callback Function that executes statements
 * @returns Result of the callback
 */
export async function executeTransaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  const db = await getDatabase();

  try {
    const result = await db.withTransactionAsync(callback);
    return result;
  } catch (error) {
    console.error('❌ Transaction failed:', error);
    throw error;
  }
}

/**
 * Drops all tables (DANGEROUS - for development/testing only)
 *
 * @warning This will delete ALL data in the database
 */
export async function dropAllTables(): Promise<void> {
  const db = await getDatabase();

  console.warn('⚠️ Dropping all tables - ALL DATA WILL BE LOST');

  try {
    // Disable foreign keys temporarily
    await db.execAsync('PRAGMA foreign_keys = OFF');

    // Get all table names
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    // Drop each table
    for (const table of tables) {
      await db.execAsync(`DROP TABLE IF EXISTS ${table.name}`);
      console.log(`🗑️ Dropped table: ${table.name}`);
    }

    // Reset schema version
    await setSchemaVersion(db, 0);

    // Re-enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON');

    console.log('✅ All tables dropped successfully');
  } catch (error) {
    console.error('❌ Failed to drop tables:', error);
    throw error;
  }
}
