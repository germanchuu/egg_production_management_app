# Data Model: Poultry Farm Production App

**Feature**: 001-poultry-farm-production-app
**Date**: 2026-01-26
**Status**: Complete

## Overview

This document defines the data entities, relationships, validation rules, and state transitions for the offline-first poultry farm production management system. The model is designed for dual storage: **local SQLite** (primary offline-first source) and **Firebase Firestore** (sync backend).

---

## Entity Relationship Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ creates
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌──────────────┐
│ Invitation  │   │ChickenHouse  │
└─────────────┘   └──────┬───────┘
                         │ contains
                         ▼
                  ┌──────────────┐
                  │ ChickenLot   │◄──────────┐
                  └──────┬───────┘           │
                         │ has               │ references
              ┌──────────┼──────────┬────────┴────────┐
              │          │          │                 │
              ▼          ▼          ▼                 ▼
     ┌────────────┐ ┌─────────┐ ┌──────────┐  ┌─────────────┐
     │Production  │ │Mortality│ │FeedBatch │  │HealthEvent/ │
     │  Record    │ │ Record  │ └────┬─────┘  │Biosecurity  │
     └────────────┘ └─────────┘      │        │   Event     │
                                      │        └─────────────┘
                                      │ used in
                                      ▼
                              ┌──────────────┐
                              │FeedingRecord │
                              └──────────────┘
```

---

## Core Entities

### 1. User

**Description**: Represents system users (administrators and standard users). Users are created by administrators and authenticated via invitation deep links.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | UUID | Yes | Unique user identifier | Auto-generated |
| `displayName` | String | Yes | User's full name | 2-100 characters |
| `role` | Enum | Yes | User role: `admin` or `user` | One of: ['admin', 'user'] |
| `authStatus` | Enum | Yes | Authentication status | One of: ['pending', 'authenticated'] |
| `createdAt` | Timestamp | Yes | Account creation timestamp | ISO-8601 |
| `lastAccessAt` | Timestamp | No | Last app access timestamp | ISO-8601 |
| `isActive` | Boolean | Yes | Account active status | Default: true |
| `invitationId` | UUID | No | Reference to current/last invitation | FK to Invitation |

**Indexes**:
- Primary: `id`
- Index: `role`, `authStatus`, `isActive`

**Local Storage (SQLite)**:
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
  auth_status TEXT NOT NULL CHECK(auth_status IN ('pending', 'authenticated')),
  created_at TEXT NOT NULL,
  last_access_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  invitation_id TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (invitation_id) REFERENCES invitations(id)
);
```

**Firestore Collection**: `users/{userId}`

**Validation Rules**:
- displayName must be 2-100 characters
- Role cannot be changed after account creation (immutable)
- authStatus transitions: pending → authenticated (one-way, no reversal)
- Only admins can create new users and generate invitations (enforced by Firebase rules)

**Access Control**:
- Admins: Can read all users, create users, generate invitations, update user status
- Users: Can read own user document, update own `displayName` and `lastAccessAt`

---

### 2. Invitation

**Description**: Invitation tokens for user authentication via deep links (Custom URL Scheme). Each invitation is generated for a specific pending user and shared via native share sheet.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | UUID | Yes | Unique invitation identifier | Auto-generated |
| `userId` | UUID | Yes | User ID for whom invitation is generated | FK to User |
| `token` | String | Yes | Unique invitation token for deep link | Cryptographically secure random string (32 chars) |
| `createdBy` | UUID | Yes | Admin user ID who generated invitation | FK to User |
| `createdAt` | Timestamp | Yes | Invitation generation timestamp | ISO-8601 |
| `expiresAt` | Timestamp | Yes | Invitation expiry (7 days from creation) | createdAt + 7 days (FR-009) |
| `status` | Enum | Yes | Invitation status | One of: ['pending', 'accepted', 'expired'] |
| `acceptedAt` | Timestamp | No | When invitation was accepted | ISO-8601 |

**Indexes**:
- Primary: `id`
- Unique: `token`
- Index: `userId`, `status`, `expiresAt`

**Local Storage (SQLite)**:
```sql
CREATE TABLE invitations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'expired')),
  accepted_at TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

**Firestore Collection**: `invitations/{invitationId}`

**State Transitions**:
```
pending → accepted (when user accepts invitation before expiry)
pending → expired (when current time > expiresAt)
```

**Validation Rules**:
- Token must be unique and cryptographically random
- Expiry date must be exactly 7 days from creation (FR-007)
- Cannot accept invitation after expiry
- Status changes are irreversible (accepted/expired cannot go back to pending)
- Admins can resend expired invitations by creating new invitation (FR-008)

**Access Control**:
- Admins: Can create invitations, read all invitations, update invitation status
- Users: Cannot access invitations (read/write restricted)
- Public: Can validate invitation token (server-side validation only)

---

### 3. ChickenHouse (Galpón)

**Description**: Physical facility where chicken lots are housed.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | UUID | Yes | Unique house identifier | Auto-generated |
| `name` | String | Yes | House name/identifier | 1-100 characters, unique |
| `description` | String | No | Optional description | Max 500 characters |
| `createdBy` | UUID | Yes | User who created the house | FK to User |
| `createdAt` | Timestamp | Yes | Creation timestamp | ISO-8601 |
| `updatedAt` | Timestamp | Yes | Last update timestamp | ISO-8601 |

**Indexes**:
- Primary: `id`
- Unique: `name`

**Local Storage (SQLite)**:
```sql
CREATE TABLE chicken_houses (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

**Firestore Collection**: `chickenHouses/{houseId}`

**Validation Rules**:
- Name must be unique across all houses
- Name cannot be empty or whitespace-only
- Cannot delete house if it contains active lots (lots with live hens > 0)

**Access Control**:
- Admins: Full CRUD access
- Users: Read-only access

---

### 4. ChickenLot

**Description**: Group of chickens purchased together, tracked with age and productivity metrics.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | UUID | Yes | Unique lot identifier | Auto-generated |
| `name` | String | Yes | Lot name/identifier | 1-100 characters |
| `chickenHouseId` | UUID | Yes | Assigned chicken house | FK to ChickenHouse |
| `purchaseDate` | Date | Yes | Date chickens were purchased | Cannot be future date |
| `initialHenCount` | Integer | Yes | Number of hens at purchase | > 0, max 1,000,000 |
| `liveHenCount` | Integer | Yes | Current number of live hens | ≥ 0, ≤ initialHenCount |
| `ageWeeks` | Integer | Yes | Age in weeks at purchase | > 0, max 200 |
| `createdBy` | UUID | Yes | User who created the lot | FK to User |
| `createdAt` | Timestamp | Yes | Creation timestamp | ISO-8601 |
| `updatedAt` | Timestamp | Yes | Last update timestamp | ISO-8601 |

**Computed Fields** (calculated on-demand):
- `currentAgeWeeks`: `ageWeeks + weeksSince(purchaseDate)`
- `totalMortality`: `initialHenCount - liveHenCount`
- `mortalityRate`: `(totalMortality / initialHenCount) * 100`
- `lifetimeEggsPerHen`: `totalEggsCollected / initialHenCount` (from production records)

**Indexes**:
- Primary: `id`
- Index: `chickenHouseId`, `purchaseDate`, `liveHenCount`

**Local Storage (SQLite)**:
```sql
CREATE TABLE chicken_lots (
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
);
```

**Firestore Collection**: `chickenLots/{lotId}`

**State Transitions**:
- `liveHenCount` decreases when mortality is recorded (automatic update)
- Lot is considered "inactive" when `liveHenCount = 0` (no new production/feeding allowed)

**Validation Rules**:
- `purchaseDate` cannot be in the future (FR-017)
- `initialHenCount` is immutable after creation (audit trail if changed)
- `liveHenCount` cannot be negative or exceed `initialHenCount` (FR-020)
- `liveHenCount` updates are automatic via mortality recording, not manual

**Access Control**:
- Admins: Full CRUD access
- Users: Read-only access, cannot create/delete lots

---

### 5. ProductionRecord

**Description**: Daily egg production data for a chicken lot.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | UUID | Yes | Unique record identifier | Auto-generated |
| `lotId` | UUID | Yes | Chicken lot reference | FK to ChickenLot |
| `date` | Date | Yes | Production date | Cannot be future date |
| `eggsCollected` | Integer | Yes | Total eggs collected | ≥ 0, max 1,000,000 |
| `recordedBy` | UUID | Yes | User who recorded data | FK to User |
| `createdAt` | Timestamp | Yes | Record creation timestamp | ISO-8601 |
| `updatedAt` | Timestamp | Yes | Last update timestamp | ISO-8601 |

**Computed Fields** (calculated on-demand):
- `eggsPerHen`: `eggsCollected / lot.liveHenCount` (uses hen count at time of production)

**Indexes**:
- Primary: `id`
- Composite Unique: `(lotId, date)` - one production record per lot per day
- Index: `lotId`, `date`, `recordedBy`

**Local Storage (SQLite)**:
```sql
CREATE TABLE production_records (
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
);
```

**Firestore Collection**: `productionRecords/{recordId}`

**Validation Rules**:
- `date` cannot be in the future (FR-017)
- One production record per lot per day (composite unique constraint)
- Cannot record production for lot with `liveHenCount = 0` (edge case handling)
- `eggsCollected` must be reasonable (e.g., < 2 * liveHenCount as sanity check)

**Access Control**:
- Admins: Full CRUD access
- Users: Create, read, update own records; read all records

---

### 6. MortalityRecord

**Description**: Daily mortality data for a chicken lot (automatically updates live hen count).

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | UUID | Yes | Unique record identifier | Auto-generated |
| `lotId` | UUID | Yes | Chicken lot reference | FK to ChickenLot |
| `date` | Date | Yes | Mortality date | Cannot be future date |
| `hensDied` | Integer | Yes | Number of hens that died | > 0, ≤ lot.liveHenCount |
| `recordedBy` | UUID | Yes | User who recorded data | FK to User |
| `createdAt` | Timestamp | Yes | Record creation timestamp | ISO-8601 |
| `updatedAt` | Timestamp | Yes | Last update timestamp | ISO-8601 |

**Side Effects**:
- When created: `ChickenLot.liveHenCount -= hensDied` (automatic update via transaction)
- Audit log triggered if `hensDied > (lot.liveHenCount * 0.10)` (>10% threshold)

**Indexes**:
- Primary: `id`
- Index: `lotId`, `date`, `recordedBy`

**Local Storage (SQLite)**:
```sql
CREATE TABLE mortality_records (
  id TEXT PRIMARY KEY,
  lot_id TEXT NOT NULL,
  date TEXT NOT NULL,
  hens_died INTEGER NOT NULL CHECK(hens_died > 0),
  recorded_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (lot_id) REFERENCES chicken_lots(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);
```

**Firestore Collection**: `mortalityRecords/{recordId}`

**Validation Rules**:
- `date` cannot be in the future
- `hensDied` cannot exceed current `lot.liveHenCount` (FR-020)
- `hensDied` must be positive (cannot record zero mortality)
- Transaction required: mortality record creation + lot `liveHenCount` update must be atomic

**Access Control**:
- Admins: Full CRUD access
- Users: Create, read, update own records; read all records

---

### 7. FeedBatch

**Description**: Prepared feed batch available for feeding chicken lots.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | UUID | Yes | Unique batch identifier | Auto-generated |
| `batchName` | String | Yes | Batch name/identifier | 1-100 characters |
| `preparationDate` | Date | Yes | Date feed was prepared | Cannot be future date |
| `quantityKg` | Decimal | Yes | Total quantity prepared (kg) | > 0, max 1,000,000 |
| `preparedBy` | UUID | Yes | User who prepared feed | FK to User |
| `createdAt` | Timestamp | Yes | Record creation timestamp | ISO-8601 |
| `updatedAt` | Timestamp | Yes | Last update timestamp | ISO-8601 |

**Computed Fields**:
- `remainingQuantityKg`: `quantityKg - SUM(feedingRecords.quantityFed)` where feedingRecords reference this batch

**Indexes**:
- Primary: `id`
- Index: `preparationDate`, `preparedBy`

**Local Storage (SQLite)**:
```sql
CREATE TABLE feed_batches (
  id TEXT PRIMARY KEY,
  batch_name TEXT NOT NULL,
  preparation_date TEXT NOT NULL,
  quantity_kg REAL NOT NULL CHECK(quantity_kg > 0),
  prepared_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (prepared_by) REFERENCES users(id)
);
```

**Firestore Collection**: `feedBatches/{batchId}`

**Validation Rules**:
- `preparationDate` cannot be in the future
- `quantityKg` must be positive decimal (2 decimal places precision)

**Access Control**:
- Admins: Full CRUD access
- Users: Create, read, update own batches; read all batches

---

### 8. FeedingRecord

**Description**: Daily feed consumption data for a chicken lot.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | UUID | Yes | Unique record identifier | Auto-generated |
| `lotId` | UUID | Yes | Chicken lot reference | FK to ChickenLot |
| `feedBatchId` | UUID | Yes | Feed batch used | FK to FeedBatch |
| `date` | Date | Yes | Feeding date | Cannot be future date |
| `quantityFedKg` | Decimal | Yes | Quantity fed (kg) | > 0, max 1,000,000 |
| `recordedBy` | UUID | Yes | User who recorded data | FK to User |
| `createdAt` | Timestamp | Yes | Record creation timestamp | ISO-8601 |
| `updatedAt` | Timestamp | Yes | Last update timestamp | ISO-8601 |

**Computed Fields**:
- `feedPerHen`: `quantityFedKg / lot.liveHenCount`

**Indexes**:
- Primary: `id`
- Index: `lotId`, `feedBatchId`, `date`, `recordedBy`

**Local Storage (SQLite)**:
```sql
CREATE TABLE feeding_records (
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
);
```

**Firestore Collection**: `feedingRecords/{recordId}`

**Validation Rules**:
- `date` cannot be in the future
- `quantityFedKg` must be positive decimal (2 decimal places)
- Cannot exceed `feedBatch.remainingQuantityKg` (warn user, but don't block)

**Access Control**:
- Admins: Full CRUD access
- Users: Create, read, update own records; read all records

---

### 9. HealthEvent

**Description**: Health-related events (vaccinations) for chicken lots.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | UUID | Yes | Unique event identifier | Auto-generated |
| `lotId` | UUID | Yes | Chicken lot reference | FK to ChickenLot |
| `eventType` | Enum | Yes | Event type: currently only `vaccination` | One of: ['vaccination'] |
| `eventDate` | Date | Yes | Date event occurred | Cannot be future date |
| `productName` | String | Yes | Vaccine/product name | 1-200 characters |
| `notes` | String | No | Optional multi-line notes | Max 2000 characters |
| `recordedBy` | UUID | Yes | User who recorded event | FK to User |
| `createdAt` | Timestamp | Yes | Record creation timestamp | ISO-8601 |
| `updatedAt` | Timestamp | Yes | Last update timestamp | ISO-8601 |

**Indexes**:
- Primary: `id`
- Index: `lotId`, `eventDate`, `eventType`, `recordedBy`

**Local Storage (SQLite)**:
```sql
CREATE TABLE health_events (
  id TEXT PRIMARY KEY,
  lot_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type = 'vaccination'),
  event_date TEXT NOT NULL,
  product_name TEXT NOT NULL,
  notes TEXT,
  recorded_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (lot_id) REFERENCES chicken_lots(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);
```

**Firestore Collection**: `healthEvents/{eventId}`

**Validation Rules**:
- `eventDate` cannot be in the future
- `eventType` currently limited to 'vaccination' (extensible for future health events)
- `productName` cannot be empty
- `notes` support multi-line text (newlines allowed)

**Access Control**:
- Admins: Full CRUD access
- Users: Create, read, update own events; read all events

---

### 10. BiosecurityEvent

**Description**: Biosecurity events (disinfectant applications) for chicken lots.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | UUID | Yes | Unique event identifier | Auto-generated |
| `lotId` | UUID | Yes | Chicken lot reference | FK to ChickenLot |
| `eventType` | Enum | Yes | Event type: currently only `disinfection` | One of: ['disinfection'] |
| `eventDate` | Date | Yes | Date event occurred | Cannot be future date |
| `productName` | String | Yes | Disinfectant product name | 1-200 characters |
| `notes` | String | No | Optional multi-line notes | Max 2000 characters |
| `recordedBy` | UUID | Yes | User who recorded event | FK to User |
| `createdAt` | Timestamp | Yes | Record creation timestamp | ISO-8601 |
| `updatedAt` | Timestamp | Yes | Last update timestamp | ISO-8601 |

**Indexes**:
- Primary: `id`
- Index: `lotId`, `eventDate`, `eventType`, `recordedBy`

**Local Storage (SQLite)**:
```sql
CREATE TABLE biosecurity_events (
  id TEXT PRIMARY KEY,
  lot_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type = 'disinfection'),
  event_date TEXT NOT NULL,
  product_name TEXT NOT NULL,
  notes TEXT,
  recorded_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (lot_id) REFERENCES chicken_lots(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);
```

**Firestore Collection**: `biosecurityEvents/{eventId}`

**Validation Rules**:
- `eventDate` cannot be in the future
- `eventType` currently limited to 'disinfection' (extensible for future biosecurity events)
- `productName` cannot be empty
- `notes` support multi-line text

**Access Control**:
- Admins: Full CRUD access
- Users: Create, read, update own events; read all events

---

## Sync Support Entities

### 11. SyncQueue

**Description**: Tracks local changes pending synchronization to Firestore.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | UUID | Yes | Unique queue entry identifier | Auto-generated |
| `entityType` | Enum | Yes | Type of entity | One of: [all entity types] |
| `entityId` | UUID | Yes | ID of changed entity | FK to respective entity |
| `operation` | Enum | Yes | Type of operation | One of: ['CREATE', 'UPDATE', 'DELETE'] |
| `localTimestamp` | Timestamp | Yes | Device timestamp when change occurred | ISO-8601 |
| `syncedAt` | Timestamp | No | When successfully synced | ISO-8601 |
| `retryCount` | Integer | Yes | Number of sync retry attempts | Default: 0 |
| `error` | String | No | Last sync error message | Max 1000 characters |

**Local Storage (SQLite)**:
```sql
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('CREATE', 'UPDATE', 'DELETE')),
  local_timestamp TEXT NOT NULL,
  synced_at TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error TEXT
);

CREATE INDEX idx_sync_pending ON sync_queue(synced_at) WHERE synced_at IS NULL;
CREATE INDEX idx_sync_entity ON sync_queue(entity_type, entity_id);
```

**Not stored in Firestore** (local-only table for sync orchestration).

**State Transitions**:
- Created when user performs CREATE/UPDATE/DELETE operation while offline or before sync completes
- `syncedAt` set when successfully uploaded to Firestore
- `retryCount` incremented on each failed sync attempt
- Removed from queue after successful sync (or retained for audit with `syncedAt` set)

---

### 12. AuditLog (Local)

**Description**: Local audit log metadata for critical operations (full audit on server).

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | UUID | Yes | Unique audit entry identifier | Auto-generated |
| `entityType` | Enum | Yes | Type of entity audited | One of: [audited entity types] |
| `entityId` | UUID | Yes | ID of audited entity | FK to respective entity |
| `operationType` | Enum | Yes | Type of operation | One of: ['CREATE', 'UPDATE', 'DELETE'] |
| `timestamp` | Timestamp | Yes | When operation occurred | ISO-8601 |
| `userId` | UUID | Yes | User who performed operation | FK to User |
| `deviceId` | String | Yes | Unique device identifier | UUID |
| `synced` | Integer | Yes | Sync status: 0=pending, 1=synced | Default: 0 |

**Local Storage (SQLite)**:
```sql
CREATE TABLE audit_log_local (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK(operation_type IN ('CREATE', 'UPDATE', 'DELETE')),
  timestamp TEXT NOT NULL,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_entity ON audit_log_local(entity_type, entity_id);
CREATE INDEX idx_audit_sync ON audit_log_local(synced);
```

**Firestore Collection**: `auditLogs/{auditId}` (with full `oldValues`/`newValues` snapshots)

---

## Data Validation Summary

### Shared Validation Rules (Zod Schemas)

All validation rules will be implemented using Zod schemas shared between client and server:

**Date Validation**:
```typescript
z.date().max(new Date(), 'Cannot use future date')
```

**Positive Integer**:
```typescript
z.number().int().positive().max(1_000_000)
```

**Decimal (2 places)**:
```typescript
z.number().positive().multipleOf(0.01).max(1_000_000)
```

**Email**:
```typescript
z.string().email()
```

**UUID**:
```typescript
z.string().uuid()
```

### Cross-Field Validation

- **MortalityRecord**: `hensDied ≤ lot.liveHenCount` (requires lot lookup)
- **ProductionRecord**: `eggsCollected < lot.liveHenCount * 2` (sanity check warning)
- **ChickenLot**: `liveHenCount ≤ initialHenCount` (enforced by CHECK constraint)

---

## Performance Considerations

### Query Optimization

**Most Frequent Queries**:

1. **Get lots for production entry**: `SELECT * FROM chicken_lots WHERE live_hen_count > 0 ORDER BY updated_at DESC LIMIT 10`
2. **Get production history for lot**: `SELECT * FROM production_records WHERE lot_id = ? ORDER BY date DESC LIMIT 365`
3. **Get pending sync items**: `SELECT * FROM sync_queue WHERE synced_at IS NULL ORDER BY local_timestamp ASC`

**Indexes**: All foreign keys and frequently queried fields have indexes to ensure <2s query times (SC-005).

### Storage Estimates

**Per Year (10 lots)**:
- Production records: ~3,650 records × 200 bytes = 730 KB
- Mortality records: ~365 records × 150 bytes = 55 KB
- Feeding records: ~3,650 records × 200 bytes = 730 KB
- Health/biosecurity events: ~200 records × 300 bytes = 60 KB
- **Total**: ~1.6 MB/year

**7-Year Retention**: ~11 MB (well within device constraints)

---

## Next Steps

1. **API Contracts**: Define REST/GraphQL endpoints for sync operations (see `contracts/` directory)
2. **Implementation**: Generate SQLite schema migrations and Firestore security rules
3. **Testing**: Create fixture data for integration tests based on entity definitions
