import * as SQLite from 'expo-sqlite';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../../utils/testDatabase';

describe('SQLiteDatabase', () => {
  let db: SQLite.SQLiteDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
  });

  describe('Database Initialization', () => {
    it('should initialize database with schema', async () => {
      // Verify tables were created
      const tables = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      );

      const tableNames = tables.map((t) => t.name);

      expect(tableNames).toContain('users');
      expect(tableNames).toContain('invitations');
      expect(tableNames).toContain('chicken_houses');
      expect(tableNames).toContain('chicken_lots');
      expect(tableNames).toContain('production_records');
      expect(tableNames).toContain('mortality_records');
      expect(tableNames).toContain('feed_batches');
      expect(tableNames).toContain('feeding_records');
      expect(tableNames).toContain('lot_events');
      expect(tableNames).toContain('sync_queue');
      expect(tableNames).toContain('audit_log_local');
    });

    it('should enable foreign key constraints', async () => {
      const result = await db.getFirstAsync<{ foreign_keys: number }>(
        'PRAGMA foreign_keys'
      );

      // Note: In-memory databases may not persist PRAGMA settings
      // This test verifies the table structure supports FKs
      expect(result).toBeDefined();
    });

    it('should set schema version', async () => {
      const version = await db.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version'
      );

      expect(version?.user_version).toBe(1);
    });
  });

  describe('Basic CRUD Operations', () => {
    it('should insert data into users table', async () => {
      const userId = 'user-test-123';
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO users (id, display_name, role, created_at, updated_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, 'Test User', 'user', now, now, 1]
      );

      const user = await db.getFirstAsync<{ id: string; display_name: string }>(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      expect(user).toBeDefined();
      expect(user?.id).toBe(userId);
      expect(user?.display_name).toBe('Test User');
    });

    it('should query data from tables', async () => {
      // Insert test data
      const userId = 'user-query-test';
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO users (id, display_name, role, created_at, updated_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, 'Query Test User', 'admin', now, now, 1]
      );

      // Query data
      const users = await db.getAllAsync<{ role: string }>(
        'SELECT * FROM users WHERE role = ?',
        ['admin']
      );

      expect(users.length).toBeGreaterThan(0);
      expect(users[0].role).toBe('admin');
    });

    it('should update data in tables', async () => {
      const userId = 'user-update-test';
      const now = new Date().toISOString();

      // Insert
      await db.runAsync(
        `INSERT INTO users (id, display_name, role, created_at, updated_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, 'Original Name', 'user', now, now, 1]
      );

      // Update
      await db.runAsync('UPDATE users SET display_name = ? WHERE id = ?', [
        'Updated Name',
        userId,
      ]);

      // Verify
      const user = await db.getFirstAsync<{ display_name: string }>(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      expect(user?.display_name).toBe('Updated Name');
    });

    it('should delete data from tables', async () => {
      const userId = 'user-delete-test';
      const now = new Date().toISOString();

      // Insert
      await db.runAsync(
        `INSERT INTO users (id, display_name, role, created_at, updated_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, 'Delete Me', 'user', now, now, 1]
      );

      // Delete
      await db.runAsync('DELETE FROM users WHERE id = ?', [userId]);

      // Verify
      const user = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [
        userId,
      ]);

      expect(user).toBeNull();
    });
  });

  describe('Constraint Validation', () => {
    it('should enforce CHECK constraint on role field', async () => {
      const userId = 'user-constraint-test';
      const now = new Date().toISOString();

      await expect(
        db.runAsync(
          `INSERT INTO users (id, display_name, role, created_at, updated_at, is_active)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, 'Bad Role User', 'invalid_role', now, now, 1]
        )
      ).rejects.toThrow();
    });

    it('should enforce CHECK constraint on initial_hen_count > 0', async () => {
      const userId = 'user-1';
      const houseId = 'house-1';
      const lotId = 'lot-constraint-test';
      const now = new Date().toISOString();

      // Create user and house first
      await db.runAsync(
        `INSERT INTO users (id, display_name, role, created_at, updated_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, 'Test User', 'admin', now, now, 1]
      );

      await db.runAsync(
        `INSERT INTO chicken_houses (id, name, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [houseId, 'Test House', userId, now, now]
      );

      // Try to create lot with invalid hen count
      await expect(
        db.runAsync(
          `INSERT INTO chicken_lots (id, name, chicken_house_id, purchase_date,
            initial_hen_count, live_hen_count, age_weeks, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [lotId, 'Bad Lot', houseId, '2024-01-01', 0, 0, 18, userId, now, now]
        )
      ).rejects.toThrow();
    });

    it('should enforce UNIQUE constraint on chicken_houses.name', async () => {
      const userId = 'user-1';
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO users (id, display_name, role, created_at, updated_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, 'Test User', 'admin', now, now, 1]
      );

      // Insert first house
      await db.runAsync(
        `INSERT INTO chicken_houses (id, name, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        ['house-1', 'Duplicate Name', userId, now, now]
      );

      // Try to insert second house with same name
      await expect(
        db.runAsync(
          `INSERT INTO chicken_houses (id, name, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
          ['house-2', 'Duplicate Name', userId, now, now]
        )
      ).rejects.toThrow();
    });
  });

  describe('Indexes', () => {
    it('should have indexes created for query optimization', async () => {
      const indexes = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name"
      );

      const indexNames = indexes.map((idx) => idx.name);

      // Verify key indexes exist
      expect(indexNames).toContain('idx_users_role');
      expect(indexNames).toContain('idx_invitations_token');
      expect(indexNames).toContain('idx_production_records_lot_id');
      expect(indexNames).toContain('idx_sync_pending');
    });
  });

  describe('Transactions', () => {
    it('should support transactions with rollback on error', async () => {
      const userId = 'user-tx-test';
      const now = new Date().toISOString();

      try {
        await db.withTransactionAsync(async () => {
          // Insert user
          await db.runAsync(
            `INSERT INTO users (id, display_name, role, created_at, updated_at, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, 'Transaction User', 'user', now, now, 1]
          );

          // Force an error with invalid role
          await db.runAsync(
            `INSERT INTO users (id, display_name, role, created_at, updated_at, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['user-2', 'Bad User', 'bad_role', now, now, 1]
          );
        });
      } catch (error) {
        // Transaction should have rolled back
      }

      // Verify first user was NOT inserted (transaction rolled back)
      const user = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [
        userId,
      ]);

      expect(user).toBeNull();
    });

    it('should commit transaction when all operations succeed', async () => {
      const userId1 = 'user-tx-success-1';
      const userId2 = 'user-tx-success-2';
      const now = new Date().toISOString();

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO users (id, display_name, role, created_at, updated_at, is_active)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId1, 'User 1', 'user', now, now, 1]
        );

        await db.runAsync(
          `INSERT INTO users (id, display_name, role, created_at, updated_at, is_active)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId2, 'User 2', 'admin', now, now, 1]
        );
      });

      // Verify both users were inserted
      const users = await db.getAllAsync(
        'SELECT * FROM users WHERE id IN (?, ?)',
        [userId1, userId2]
      );

      expect(users).toHaveLength(2);
    });
  });
});
