import * as SQLite from 'expo-sqlite';

/**
 * Creates an in-memory SQLite database for testing
 * @returns Promise<SQLiteDatabase>
 */
export async function createTestDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(':memory:');

  try {
    // Enable foreign key constraints first
    await db.execAsync('PRAGMA foreign_keys = ON');

    // Import schema
    const { getSchemaSQL, getSchemaVersion } =
      await import('@/shared/database/schema');
    const schemaSQL = getSchemaSQL();
    const version = getSchemaVersion();

    // Execute all schema statements as a single batch
    // Join with semicolons and newlines for proper SQL execution
    const batchSQL = schemaSQL.join(';\n') + ';';
    await db.execAsync(batchSQL);

    // Set schema version
    await db.execAsync(`PRAGMA user_version = ${version}`);

    return db;
  } catch (error) {
    console.error('Failed to create test database:', error);
    throw error;
  }
}

/**
 * Seeds the test database with fixture data
 * @param db - SQLite database instance
 * @param fixtures - Object with table names as keys and arrays of records as values
 */
export async function seedTestData(
  db: SQLite.SQLiteDatabase,
  fixtures: Record<string, any[]>
): Promise<void> {
  for (const [tableName, records] of Object.entries(fixtures)) {
    for (const record of records) {
      const columns = Object.keys(record);
      const placeholders = columns.map(() => '?').join(', ');
      const columnNames = columns.join(', ');
      const values = Object.values(record);

      await db.runAsync(
        `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`,
        ...(values as SQLite.SQLiteBindValue[])
      );
    }
  }
}

/**
 * Cleans up and closes the test database
 * @param db - SQLite database instance
 */
export async function cleanupTestDatabase(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  await db.closeAsync();
}

/**
 * Clears all data from specified tables
 * @param db - SQLite database instance
 * @param tableNames - Array of table names to clear
 */
export async function clearTables(
  db: SQLite.SQLiteDatabase,
  tableNames: string[]
): Promise<void> {
  for (const tableName of tableNames) {
    await db.runAsync(`DELETE FROM ${tableName}`);
  }
}
