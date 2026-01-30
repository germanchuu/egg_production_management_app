/**
 * Entity Type Definitions
 *
 * TypeScript interfaces for all database entities.
 * These types match the SQLite schema structure with camelCase naming.
 */

// ==================== ENUMS ====================

/**
 * User roles in the system
 */
export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

/**
 * User authentication status
 */
export enum AuthStatus {
  Pending = 'pending',
  Authenticated = 'authenticated',
}

/**
 * Invitation status
 */
export enum InvitationStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Expired = 'expired',
}

/**
 * Event types for lot events (health & biosecurity)
 */
export enum LotEventType {
  Vaccination = 'vaccination',
  Disinfection = 'disinfection',
}

/**
 * Sync queue operation types
 */
export enum SyncOperation {
  Create = 'CREATE',
  Update = 'UPDATE',
  Delete = 'DELETE',
}

// ==================== CORE ENTITIES ====================

/**
 * Authorized device information for multi-device support
 */
export interface AuthorizedDevice {
  deviceId: string; // UUID
  deviceName: string; // Device name (e.g., "iPhone 12", "Samsung Galaxy S21")
  authorizedAt: string; // ISO-8601 timestamp when device was authorized
}

/**
 * Local session data stored in expo-secure-store
 */
export interface SessionData {
  userId: string; // User ID
  deviceId: string; // Unique device identifier (UUID)
  authenticatedAt: string; // ISO-8601 timestamp when device was authenticated
  lastValidatedAt: string; // ISO-8601 timestamp of last online validation
}

/**
 * User entity
 *
 * Represents system users (administrators and standard users).
 * Authentication uses invitation-based system with deep links.
 * Supports multi-device access (max 3 devices per user).
 */
export interface User {
  id: string; // UUID
  displayName: string;
  role: UserRole;
  authStatus: AuthStatus;
  authorizedDevices?: AuthorizedDevice[]; // Max 3 devices per user
  createdAt: string; // ISO-8601 timestamp
  lastAccessAt?: string; // ISO-8601 timestamp
  isActive: boolean;
  invitationId?: string; // Reference to invitation used
  updatedAt: string; // ISO-8601 timestamp
}

/**
 * Invitation entity
 *
 * Token-based invitations shared via native share sheet (no email).
 * Deep links use Custom URL Scheme (myapp://invite/[token]).
 * One-time use only, expires after 7 days.
 */
export interface Invitation {
  id: string; // UUID
  userId: string; // User ID for whom invitation is generated
  token: string; // Unique invitation token for deep link (one-time use)
  createdBy: string; // Admin user ID who generated invitation
  createdAt: string; // ISO-8601 timestamp
  expiresAt: string; // ISO-8601 timestamp (7 days from creation)
  status: InvitationStatus;
  acceptedAt?: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

/**
 * ChickenHouse entity (Galpón)
 *
 * Physical facility where chicken lots are housed.
 */
export interface ChickenHouse {
  id: string; // UUID
  name: string; // Unique identifier/name
  description?: string;
  createdBy: string; // User ID
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

/**
 * ChickenLot entity
 *
 * Group of chickens purchased together, tracked with age and productivity metrics.
 */
export interface ChickenLot {
  id: string; // UUID
  name: string;
  chickenHouseId: string; // Reference to ChickenHouse
  purchaseDate: string; // ISO-8601 date (YYYY-MM-DD)
  initialHenCount: number; // Immutable after creation
  liveHenCount: number; // Updated automatically via mortality records
  ageWeeks: number; // Age in weeks at purchase
  createdBy: string; // User ID
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

/**
 * ProductionRecord entity
 *
 * Daily egg production data for a chicken lot.
 * One record per lot per day (composite unique constraint).
 */
export interface ProductionRecord {
  id: string; // UUID
  lotId: string; // Reference to ChickenLot
  date: string; // ISO-8601 date (YYYY-MM-DD)
  eggsCollected: number;
  recordedBy: string; // User ID
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

/**
 * MortalityRecord entity
 *
 * Daily mortality data for a chicken lot.
 * Automatically updates ChickenLot.liveHenCount when created.
 */
export interface MortalityRecord {
  id: string; // UUID
  lotId: string; // Reference to ChickenLot
  date: string; // ISO-8601 date (YYYY-MM-DD)
  hensDied: number; // Must be > 0
  recordedBy: string; // User ID
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

/**
 * FeedBatch entity
 *
 * Prepared feed batch available for feeding chicken lots.
 */
export interface FeedBatch {
  id: string; // UUID
  batchName: string;
  preparationDate: string; // ISO-8601 date (YYYY-MM-DD)
  quantityKg: number; // Decimal (2 places)
  preparedBy: string; // User ID
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

/**
 * FeedingRecord entity
 *
 * Daily feed consumption data for a chicken lot.
 */
export interface FeedingRecord {
  id: string; // UUID
  lotId: string; // Reference to ChickenLot
  feedBatchId: string; // Reference to FeedBatch
  date: string; // ISO-8601 date (YYYY-MM-DD)
  quantityFedKg: number; // Decimal (2 places)
  recordedBy: string; // User ID
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

/**
 * LotEvent entity (Unified Health & Biosecurity)
 *
 * Health and biosecurity events for chicken lots.
 * Supports vaccination and disinfection events.
 */
export interface LotEvent {
  id: string; // UUID
  lotId: string; // Reference to ChickenLot
  eventType: LotEventType; // 'vaccination' or 'disinfection'
  eventDate: string; // ISO-8601 date (YYYY-MM-DD)
  productName: string; // Vaccine or disinfectant product name
  notes?: string; // Multi-line notes
  recordedBy: string; // User ID
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

// ==================== SYNC SUPPORT ENTITIES ====================

/**
 * SyncQueueEntry entity
 *
 * Tracks local changes pending synchronization to Firestore.
 * Local-only table for sync orchestration.
 */
export interface SyncQueueEntry {
  id: string; // UUID
  entityType: string; // Type of entity (e.g., 'User', 'ProductionRecord')
  entityId: string; // ID of changed entity
  operation: SyncOperation; // CREATE, UPDATE, or DELETE
  localTimestamp: string; // ISO-8601 timestamp
  syncedAt?: string; // ISO-8601 timestamp when successfully synced
  retryCount: number; // Number of sync retry attempts
  error?: string; // Last sync error message
}

/**
 * AuditLogEntry entity
 *
 * Local audit log metadata for critical operations.
 * Full audit with snapshots stored in Firestore.
 */
export interface AuditLogEntry {
  id: string; // UUID
  entityType: string; // Type of entity audited
  entityId: string; // ID of audited entity
  operationType: SyncOperation; // CREATE, UPDATE, or DELETE
  timestamp: string; // ISO-8601 timestamp
  userId: string; // User who performed operation
  deviceId: string; // Unique device identifier (UUID)
  synced: boolean; // Sync status (false=pending, true=synced)
}

// ==================== COMPUTED FIELDS (Not stored in DB) ====================

/**
 * Computed fields for ChickenLot
 *
 * These are calculated on-demand, not stored in the database.
 */
export interface ChickenLotComputed {
  currentAgeWeeks: number; // ageWeeks + weeksSince(purchaseDate)
  totalMortality: number; // initialHenCount - liveHenCount
  mortalityRate: number; // (totalMortality / initialHenCount) * 100
  lifetimeEggsPerHen: number; // totalEggsCollected / initialHenCount
}

/**
 * Computed fields for ProductionRecord
 */
export interface ProductionRecordComputed {
  eggsPerHen: number; // eggsCollected / lot.liveHenCount
}

/**
 * Computed fields for FeedBatch
 */
export interface FeedBatchComputed {
  remainingQuantityKg: number; // quantityKg - SUM(feedingRecords.quantityFedKg)
}

/**
 * Computed fields for FeedingRecord
 */
export interface FeedingRecordComputed {
  feedPerHen: number; // quantityFedKg / lot.liveHenCount
}

// ==================== ENTITY TYPE UNION ====================

/**
 * Union type of all entities for type-safe entity operations
 */
export type Entity =
  | User
  | Invitation
  | ChickenHouse
  | ChickenLot
  | ProductionRecord
  | MortalityRecord
  | FeedBatch
  | FeedingRecord
  | LotEvent
  | SyncQueueEntry
  | AuditLogEntry;

/**
 * Entity type names (for sync queue and audit log)
 */
export type EntityType =
  | 'User'
  | 'Invitation'
  | 'ChickenHouse'
  | 'ChickenLot'
  | 'ProductionRecord'
  | 'MortalityRecord'
  | 'FeedBatch'
  | 'FeedingRecord'
  | 'LotEvent'
  | 'SyncQueueEntry'
  | 'AuditLogEntry';
