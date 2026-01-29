/**
 * Mock for expo-sqlite using better-sqlite3
 *
 * This mock provides a real SQLite database in memory for testing,
 * avoiding the need to mock database behavior.
 */

import Database from 'better-sqlite3';

// Store database instances by name
const databases = new Map<string, Database.Database>();

/**
 * Opens or creates an in-memory SQLite database
 */
export const openDatabaseAsync = jest.fn(
  async (databaseName: string): Promise<any> => {
    // Use :memory: for test databases
    const dbName = databaseName === ':memory:' ? ':memory:' : `:memory:`;

    let db = databases.get(dbName);
    if (!db) {
      db = new Database(dbName);
      databases.set(dbName, db);
    }

    return {
      /**
       * Execute SQL statements (can include multiple statements separated by semicolons)
       */
      execAsync: jest.fn((source: string) => {
        return new Promise<void>((resolve, reject) => {
          try {
            db!.exec(source);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      }),

      /**
       * Get all rows from a query
       */
      getAllAsync: jest.fn(<T = any>(sql: string, params?: any[]) => {
        return new Promise<T[]>((resolve, reject) => {
          try {
            const stmt = db!.prepare(sql);
            const result = params ? stmt.all(...params) : stmt.all();
            resolve(result as T[]);
          } catch (error) {
            reject(error);
          }
        });
      }),

      /**
       * Get first row from a query
       */
      getFirstAsync: jest.fn(<T = any>(sql: string, params?: any[]) => {
        return new Promise<T | null>((resolve, reject) => {
          try {
            const stmt = db!.prepare(sql);
            const result = params ? stmt.get(...params) : stmt.get();
            resolve((result as T) || null);
          } catch (error) {
            reject(error);
          }
        });
      }),

      /**
       * Run an INSERT/UPDATE/DELETE statement
       */
      runAsync: jest.fn((sql: string, ...params: any[]) => {
        return new Promise((resolve, reject) => {
          try {
            // Handle both formats: runAsync(sql, p1, p2, p3) and runAsync(sql, [p1, p2, p3])
            const bindParams = params.length === 1 && Array.isArray(params[0])
              ? params[0]
              : params;

            const stmt = db!.prepare(sql);
            const result = stmt.run(...bindParams);
            resolve({
              lastInsertRowId: Number(result.lastInsertRowid),
              changes: result.changes,
            });
          } catch (error) {
            reject(error);
          }
        });
      }),

      /**
       * Execute statements within a transaction
       */
      withTransactionAsync: jest.fn(async (callback: () => Promise<void>) => {
        // better-sqlite3 uses sync transactions, so we need to wrap the async callback
        try {
          db!.prepare('BEGIN').run();
          await callback();
          db!.prepare('COMMIT').run();
        } catch (error) {
          db!.prepare('ROLLBACK').run();
          throw error;
        }
      }),

      /**
       * Close the database connection
       */
      closeAsync: jest.fn(async () => {
        db!.close();
        databases.delete(dbName);
      }),
    };
  }
);

// Helper to clear all test databases
export const __clearAllDatabases = () => {
  for (const db of databases.values()) {
    try {
      db.close();
    } catch (e) {
      // Database might already be closed
    }
  }
  databases.clear();
};

export const __getMockDb = () => databases;
export const __resetMockDb = () => {
  __clearAllDatabases();
  openDatabaseAsync.mockClear();
};
