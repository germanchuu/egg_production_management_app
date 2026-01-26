/**
 * SQLite Database Schema
 *
 * Complete schema definition for the offline-first poultry farm production app.
 * All tables support sync with Firebase Firestore.
 *
 * Schema Design:
 * - Snake_case for SQL column names (SQLite convention)
 * - TEXT for all dates/timestamps (ISO-8601 format)
 * - INTEGER for booleans (0=false, 1=true)
 * - REAL for decimal numbers (quantity_kg)
 * - CHECK constraints for data integrity
 * - Foreign keys with proper references
 * - Indexes for query optimization
 */

export const SCHEMA_VERSION = 1;

/**
 * Core Tables Schema
 */
export const CREATE_TABLES_SQL = [
  // ==================== USERS ====================
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    phone_number TEXT,
    id_number TEXT,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
    created_at TEXT NOT NULL,
    last_login_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    invitation_id TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (invitation_id) REFERENCES invitations(id)
  );`,

  // ==================== INVITATIONS ====================
  `CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
    token TEXT UNIQUE NOT NULL,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'expired')),
    accepted_at TEXT,
    accepted_by TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (accepted_by) REFERENCES users(id)
  );`,

  // ==================== CHICKEN HOUSES ====================
  `CREATE TABLE IF NOT EXISTS chicken_houses (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );`,

  // ==================== CHICKEN LOTS ====================
  `CREATE TABLE IF NOT EXISTS chicken_lots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    chicken_house_id TEXT NOT NULL,
    purchase_date TEXT NOT NULL,
    initial_hen_count INTEGER NOT NULL CHECK(initial_hen_count > 0),
    live_hen_count INTEGER NOT NULL CHECK(live_hen_count >= 0 AND live_hen_count <= initial_hen_count),
    age_weeks INTEGER NOT NULL CHECK(age_weeks > 0),
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (chicken_house_id) REFERENCES chicken_houses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );`,

  // ==================== PRODUCTION RECORDS ====================
  `CREATE TABLE IF NOT EXISTS production_records (
    id TEXT PRIMARY KEY,
    lot_id TEXT NOT NULL,
    date TEXT NOT NULL,
    eggs_collected INTEGER NOT NULL CHECK(eggs_collected >= 0),
    recorded_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (lot_id) REFERENCES chicken_lots(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id),
    UNIQUE(lot_id, date)
  );`,

  // ==================== MORTALITY RECORDS ====================
  `CREATE TABLE IF NOT EXISTS mortality_records (
    id TEXT PRIMARY KEY,
    lot_id TEXT NOT NULL,
    date TEXT NOT NULL,
    hens_died INTEGER NOT NULL CHECK(hens_died > 0),
    recorded_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (lot_id) REFERENCES chicken_lots(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
  );`,

  // ==================== FEED BATCHES ====================
  `CREATE TABLE IF NOT EXISTS feed_batches (
    id TEXT PRIMARY KEY,
    batch_name TEXT NOT NULL,
    preparation_date TEXT NOT NULL,
    quantity_kg REAL NOT NULL CHECK(quantity_kg > 0),
    prepared_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (prepared_by) REFERENCES users(id)
  );`,

  // ==================== FEEDING RECORDS ====================
  `CREATE TABLE IF NOT EXISTS feeding_records (
    id TEXT PRIMARY KEY,
    lot_id TEXT NOT NULL,
    feed_batch_id TEXT NOT NULL,
    date TEXT NOT NULL,
    quantity_fed_kg REAL NOT NULL CHECK(quantity_fed_kg > 0),
    recorded_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (lot_id) REFERENCES chicken_lots(id),
    FOREIGN KEY (feed_batch_id) REFERENCES feed_batches(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
  );`,

  // ==================== LOT EVENTS (Health & Biosecurity) ====================
  `CREATE TABLE IF NOT EXISTS lot_events (
    id TEXT PRIMARY KEY,
    lot_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK(event_type IN ('vaccination', 'disinfection')),
    event_date TEXT NOT NULL,
    product_name TEXT NOT NULL,
    notes TEXT,
    recorded_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (lot_id) REFERENCES chicken_lots(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
  );`,

  // ==================== SYNC QUEUE ====================
  `CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK(operation IN ('CREATE', 'UPDATE', 'DELETE')),
    local_timestamp TEXT NOT NULL,
    synced_at TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    error TEXT
  );`,

  // ==================== AUDIT LOG (LOCAL) ====================
  `CREATE TABLE IF NOT EXISTS audit_log_local (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK(operation_type IN ('CREATE', 'UPDATE', 'DELETE')),
    timestamp TEXT NOT NULL,
    user_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    synced INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`,
];

/**
 * Indexes for Query Optimization
 *
 * Indexes are created for:
 * - Foreign keys (to speed up joins)
 * - Frequently queried fields (date, status, etc.)
 * - Composite unique constraints
 * - Sync-related queries (pending items)
 */
export const CREATE_INDEXES_SQL = [
  // ==================== USERS ====================
  'CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);',
  'CREATE INDEX IF NOT EXISTS idx_users_id_number ON users(id_number);',
  'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);',
  'CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);',

  // ==================== INVITATIONS ====================
  'CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);',
  'CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);',
  'CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);',

  // ==================== CHICKEN HOUSES ====================
  'CREATE INDEX IF NOT EXISTS idx_chicken_houses_name ON chicken_houses(name);',

  // ==================== CHICKEN LOTS ====================
  'CREATE INDEX IF NOT EXISTS idx_chicken_lots_house_id ON chicken_lots(chicken_house_id);',
  'CREATE INDEX IF NOT EXISTS idx_chicken_lots_purchase_date ON chicken_lots(purchase_date);',
  'CREATE INDEX IF NOT EXISTS idx_chicken_lots_live_hen_count ON chicken_lots(live_hen_count);',

  // ==================== PRODUCTION RECORDS ====================
  'CREATE INDEX IF NOT EXISTS idx_production_records_lot_id ON production_records(lot_id);',
  'CREATE INDEX IF NOT EXISTS idx_production_records_date ON production_records(date);',
  'CREATE INDEX IF NOT EXISTS idx_production_records_recorded_by ON production_records(recorded_by);',

  // ==================== MORTALITY RECORDS ====================
  'CREATE INDEX IF NOT EXISTS idx_mortality_records_lot_id ON mortality_records(lot_id);',
  'CREATE INDEX IF NOT EXISTS idx_mortality_records_date ON mortality_records(date);',
  'CREATE INDEX IF NOT EXISTS idx_mortality_records_recorded_by ON mortality_records(recorded_by);',

  // ==================== FEED BATCHES ====================
  'CREATE INDEX IF NOT EXISTS idx_feed_batches_preparation_date ON feed_batches(preparation_date);',
  'CREATE INDEX IF NOT EXISTS idx_feed_batches_prepared_by ON feed_batches(prepared_by);',

  // ==================== FEEDING RECORDS ====================
  'CREATE INDEX IF NOT EXISTS idx_feeding_records_lot_id ON feeding_records(lot_id);',
  'CREATE INDEX IF NOT EXISTS idx_feeding_records_feed_batch_id ON feeding_records(feed_batch_id);',
  'CREATE INDEX IF NOT EXISTS idx_feeding_records_date ON feeding_records(date);',
  'CREATE INDEX IF NOT EXISTS idx_feeding_records_recorded_by ON feeding_records(recorded_by);',

  // ==================== LOT EVENTS (Health & Biosecurity) ====================
  'CREATE INDEX IF NOT EXISTS idx_lot_events_lot_id ON lot_events(lot_id);',
  'CREATE INDEX IF NOT EXISTS idx_lot_events_event_date ON lot_events(event_date);',
  'CREATE INDEX IF NOT EXISTS idx_lot_events_event_type ON lot_events(event_type);',
  'CREATE INDEX IF NOT EXISTS idx_lot_events_recorded_by ON lot_events(recorded_by);',

  // ==================== SYNC QUEUE ====================
  // Partial index for pending sync items (most frequent query)
  'CREATE INDEX IF NOT EXISTS idx_sync_pending ON sync_queue(synced_at) WHERE synced_at IS NULL;',
  'CREATE INDEX IF NOT EXISTS idx_sync_entity ON sync_queue(entity_type, entity_id);',

  // ==================== AUDIT LOG (LOCAL) ====================
  'CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log_local(entity_type, entity_id);',
  'CREATE INDEX IF NOT EXISTS idx_audit_sync ON audit_log_local(synced);',
];

/**
 * Complete Schema Initialization
 *
 * Returns array of all SQL statements needed to initialize the database.
 * Execute in order: tables first, then indexes.
 */
export function getSchemaSQL(): string[] {
  return [...CREATE_TABLES_SQL, ...CREATE_INDEXES_SQL];
}

/**
 * Schema Version Info
 *
 * Used for migration tracking. When schema changes, increment SCHEMA_VERSION
 * and add migration logic.
 */
export function getSchemaVersion(): number {
  return SCHEMA_VERSION;
}
