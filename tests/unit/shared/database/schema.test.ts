import { getSchemaSQL, getSchemaVersion, CREATE_TABLES_SQL, CREATE_INDEXES_SQL } from '@/shared/database/schema';

describe('Database Schema', () => {
  describe('getSchemaVersion', () => {
    it('should return correct schema version', () => {
      expect(getSchemaVersion()).toBe(1);
    });
  });

  describe('getSchemaSQL', () => {
    let schema: string[];

    beforeAll(() => {
      schema = getSchemaSQL();
    });

    it('should return array of SQL statements', () => {
      expect(Array.isArray(schema)).toBe(true);
      expect(schema.length).toBeGreaterThan(0);
    });

    it('should include all 11 core tables', () => {
      const schemaString = schema.join('\n');

      expect(schemaString).toContain('CREATE TABLE IF NOT EXISTS users');
      expect(schemaString).toContain('CREATE TABLE IF NOT EXISTS invitations');
      expect(schemaString).toContain('CREATE TABLE IF NOT EXISTS chicken_houses');
      expect(schemaString).toContain('CREATE TABLE IF NOT EXISTS chicken_lots');
      expect(schemaString).toContain('CREATE TABLE IF NOT EXISTS production_records');
      expect(schemaString).toContain('CREATE TABLE IF NOT EXISTS mortality_records');
      expect(schemaString).toContain('CREATE TABLE IF NOT EXISTS feed_batches');
      expect(schemaString).toContain('CREATE TABLE IF NOT EXISTS feeding_records');
      expect(schemaString).toContain('CREATE TABLE IF NOT EXISTS lot_events');
      expect(schemaString).toContain('CREATE TABLE IF NOT EXISTS sync_queue');
      expect(schemaString).toContain('CREATE TABLE IF NOT EXISTS audit_log_local');
    });

    it('should define foreign key constraints', () => {
      const schemaString = schema.join('\n');

      // Key foreign key relationships
      expect(schemaString).toContain('FOREIGN KEY (chicken_house_id)');
      expect(schemaString).toContain('FOREIGN KEY (lot_id)');
      expect(schemaString).toContain('FOREIGN KEY (feed_batch_id)');
      expect(schemaString).toContain('FOREIGN KEY (recorded_by) REFERENCES users(id)');
      expect(schemaString).toContain('FOREIGN KEY (created_by) REFERENCES users(id)');
    });

    it('should define check constraints for data integrity', () => {
      const schemaString = schema.join('\n');

      // Role checks
      expect(schemaString).toContain("CHECK(role IN ('admin', 'user'))");

      // Invitation status checks
      expect(schemaString).toContain("CHECK(status IN ('pending', 'accepted', 'expired'))");

      // Numeric constraints
      expect(schemaString).toContain('CHECK(initial_hen_count > 0)');
      expect(schemaString).toContain('CHECK(live_hen_count >= 0 AND live_hen_count <= initial_hen_count)');
      expect(schemaString).toContain('CHECK(hens_died > 0)');
      expect(schemaString).toContain('CHECK(eggs_collected >= 0)');

      // Event type checks
      expect(schemaString).toContain("CHECK(event_type IN ('vaccination', 'disinfection'))");

      // Sync operation checks
      expect(schemaString).toContain("CHECK(operation IN ('CREATE', 'UPDATE', 'DELETE'))");
    });

    it('should define unique constraints', () => {
      const schemaString = schema.join('\n');

      // Token uniqueness for invitations
      expect(schemaString).toContain('token TEXT UNIQUE NOT NULL');

      // House name uniqueness
      expect(schemaString).toContain('name TEXT UNIQUE NOT NULL');

      // Composite unique constraint for production records
      expect(schemaString).toContain('UNIQUE(lot_id, date)');
    });

    it('should include indexes for query optimization', () => {
      const schemaString = schema.join('\n');

      // User indexes
      expect(schemaString).toContain('CREATE INDEX IF NOT EXISTS idx_users_role');
      expect(schemaString).toContain('CREATE INDEX IF NOT EXISTS idx_users_auth_status');

      // Invitation indexes
      expect(schemaString).toContain('CREATE INDEX IF NOT EXISTS idx_invitations_token');
      expect(schemaString).toContain('CREATE INDEX IF NOT EXISTS idx_invitations_status');

      // Production record indexes
      expect(schemaString).toContain('CREATE INDEX IF NOT EXISTS idx_production_records_lot_id');
      expect(schemaString).toContain('CREATE INDEX IF NOT EXISTS idx_production_records_date');

      // Sync queue indexes
      expect(schemaString).toContain('CREATE INDEX IF NOT EXISTS idx_sync_pending');
      expect(schemaString).toContain('CREATE INDEX IF NOT EXISTS idx_sync_entity');
    });

    it('should have tables defined before indexes', () => {
      const firstTableIndex = schema.findIndex(sql => sql.includes('CREATE TABLE'));
      const firstIndexIndex = schema.findIndex(sql => sql.includes('CREATE INDEX'));

      expect(firstTableIndex).toBeLessThan(firstIndexIndex);
    });
  });

  describe('CREATE_TABLES_SQL', () => {
    it('should have 11 table definitions', () => {
      expect(CREATE_TABLES_SQL).toHaveLength(11);
    });

    it('should define all tables with IF NOT EXISTS', () => {
      CREATE_TABLES_SQL.forEach(sql => {
        expect(sql).toContain('CREATE TABLE IF NOT EXISTS');
      });
    });
  });

  describe('CREATE_INDEXES_SQL', () => {
    it('should have expected number of indexes', () => {
      // Should be at least 23 indexes as specified in the plan
      expect(CREATE_INDEXES_SQL.length).toBeGreaterThanOrEqual(23);
    });

    it('should define all indexes with IF NOT EXISTS', () => {
      CREATE_INDEXES_SQL.forEach(sql => {
        expect(sql).toContain('CREATE INDEX IF NOT EXISTS');
      });
    });
  });
});
