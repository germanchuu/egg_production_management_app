/**
 * SyncService
 *
 * Manages bidirectional synchronization between local SQLite and Firebase Firestore.
 *
 * Sync Flow:
 * 1. Upload Phase: Upload pending local changes to Firestore
 * 2. Download Phase: Download remote updates and apply conflict resolution
 * 3. Cleanup: Mark synced operations and update last sync timestamp
 *
 * Usage:
 * ```typescript
 * import { SyncService } from '@/shared/sync/SyncService';
 * import { getDatabase } from '@/shared/database';
 * import { firestore } from '@/core/config/firebase';
 *
 * const db = getDatabase();
 * const syncQueue = new SyncQueue(db);
 * const conflictResolver = new ConflictResolver();
 * const syncService = new SyncService(db, firestore, syncQueue, conflictResolver);
 *
 * // Execute full sync
 * const result = await syncService.sync();
 * console.log(`Uploaded: ${result.uploaded}, Downloaded: ${result.downloaded}`);
 * ```
 */

import * as SQLite from 'expo-sqlite';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type WhereFilterOp,
} from 'firebase/firestore';
import { SyncQueue, QueueRecord, SyncOperation } from './SyncQueue';
import { ConflictResolver, TimestampedDocument } from './ConflictResolver';

/**
 * Sync statistics result
 */
export interface SyncResult {
  uploaded: number;
  downloaded: number;
  conflicts: number;
  errors: string[];
}

/**
 * Entity type to Firestore collection mapping
 */
const COLLECTION_MAP: Record<string, string> = {
  production_records: 'production_records',
  mortality_records: 'mortality_records',
  chicken_lots: 'chicken_lots',
  chicken_houses: 'chicken_houses',
  users: 'users',
  invitations: 'invitations',
  feed_batches: 'feed_batches',
  feeding_records: 'feeding_records',
  health_events: 'health_events',
  biosecurity_events: 'biosecurity_events',
  audit_logs: 'audit_logs', // Firestore collection for audit logs
};

/**
 * Item prepared for batch write
 */
interface BatchItem {
  queueRecord: QueueRecord;
  docRef: DocumentReference;
  operation: string;
  data?: DocumentData;
}

/** Maximum number of operations per Firestore writeBatch */
const BATCH_SIZE = 500;

/**
 * SyncService for bidirectional Firebase Firestore synchronization
 */
export class SyncService {
  constructor(
    private db: SQLite.SQLiteDatabase,
    private firestore: Firestore,
    private syncQueue: SyncQueue,
    private conflictResolver: ConflictResolver
  ) {}

  /**
   * Uploads all pending local changes to Firestore using batch writes.
   *
   * Process:
   * 1. Get up to 500 pending operations from sync queue
   * 2. Prepare batch items (read local data, build doc refs)
   * 3. Commit atomically via Firestore writeBatch
   * 4. Mark all committed items as synced
   * 5. Repeat until no more pending items
   *
   * @returns Number of successfully uploaded operations
   * @throws Error if batch commit fails (no items marked as synced for that batch)
   */
  async batchSync(): Promise<number> {
    let totalUploaded = 0;

    let pending = await this.syncQueue.getPending(BATCH_SIZE);

    while (pending.length > 0) {
      const batch = writeBatch(this.firestore);
      const batchItems: BatchItem[] = [];

      for (const queueItem of pending) {
        try {
          const item = await this.prepareBatchItem(queueItem);
          if (!item) continue;

          if (item.operation === 'DELETE') {
            batch.delete(item.docRef);
          } else {
            batch.set(item.docRef, item.data!);
          }

          batchItems.push(item);
        } catch (error) {
          // Skip this item, log warning, it stays pending for next sync
          console.warn(
            `Failed to prepare batch item ${queueItem.entity_type}/${queueItem.entity_id}: ${(error as Error).message}`
          );
        }
      }

      if (batchItems.length === 0) {
        // All items in this batch were skipped — stop to avoid infinite loop.
        // Skipped items stay pending for the next sync cycle.
        break;
      }

      await batch.commit();

      const syncedIds = batchItems.map((item) => item.queueRecord.id);
      await this.syncQueue.markBatchSynced(syncedIds);

      totalUploaded += batchItems.length;

      pending = await this.syncQueue.getPending(BATCH_SIZE);
    }

    return totalUploaded;
  }

  /**
   * Prepares a single queue record for batch write.
   *
   * @returns BatchItem ready for batch, or null if entity not found locally (logged as warning)
   */
  private async prepareBatchItem(queueItem: QueueRecord): Promise<BatchItem | null> {
    const { entity_type, entity_id, operation } = queueItem;

    const collectionName = COLLECTION_MAP[entity_type];
    if (!collectionName) {
      throw new Error(`Unknown entity type: ${entity_type}`);
    }

    const docRef = doc(this.firestore, collectionName, entity_id);

    if (operation === 'DELETE') {
      return { queueRecord: queueItem, docRef, operation };
    }

    // For CREATE and UPDATE, read data from local DB
    const localData = await this.readEntityFromLocalDB(entity_type, entity_id);
    if (!localData) {
      console.warn(`Entity not found in local DB: ${entity_type}/${entity_id}, skipping`);
      return null;
    }

    const firestoreData = this.convertToFirestoreFormat(entity_type, localData);
    return { queueRecord: queueItem, docRef, operation, data: firestoreData };
  }

  /**
   * @deprecated Use batchSync() instead. Kept for backward compatibility.
   *
   * Uploads all pending local changes to Firestore one by one.
   */
  async uploadPendingChanges(): Promise<number> {
    const pending = await this.syncQueue.getPending();
    let uploadCount = 0;

    for (const queueItem of pending) {
      try {
        await this.uploadSingleChange(queueItem);
        await this.syncQueue.markSynced(queueItem.id);
        uploadCount++;
      } catch (error) {
        // Re-throw to stop sync on error
        throw error;
      }
    }

    return uploadCount;
  }

  /**
   * Uploads a single change to Firestore
   */
  private async uploadSingleChange(queueItem: QueueRecord): Promise<void> {
    const { entity_type, entity_id, operation } = queueItem;

    const collectionName = COLLECTION_MAP[entity_type];
    if (!collectionName) {
      throw new Error(`Unknown entity type: ${entity_type}`);
    }

    const docRef = doc(this.firestore, collectionName, entity_id);

    if (operation === 'DELETE') {
      await deleteDoc(docRef);
      return;
    }

    // For CREATE and UPDATE, read data from local DB
    const localData = await this.readEntityFromLocalDB(entity_type, entity_id);
    if (!localData) {
      throw new Error(
        `Entity not found in local DB: ${entity_type}/${entity_id}`
      );
    }

    // Convert snake_case DB fields to camelCase for Firestore
    const firestoreData = this.convertToFirestoreFormat(entity_type, localData);

    await setDoc(docRef, firestoreData);
  }

  /**
   * Reads entity data from local SQLite database
   */
  private async readEntityFromLocalDB(
    entityType: string,
    entityId: string
  ): Promise<any> {
    // Map entity type to table name (handle special cases)
    const TABLE_NAME_MAP: Record<string, string> = {
      audit_logs: 'audit_log_local',
    };

    const tableName = TABLE_NAME_MAP[entityType] || entityType;
    const result = await this.db.getFirstAsync(
      `SELECT * FROM ${tableName} WHERE id = ?`,
      [entityId]
    );

    return result;
  }

  /**
   * Converts snake_case database format to camelCase Firestore format
   */
  private convertToFirestoreFormat(entityType: string, dbRecord: any): any {
    if (entityType === 'production_records') {
      return {
        id: dbRecord.id,
        lotId: dbRecord.lot_id,
        date: dbRecord.date,
        eggsCollected: dbRecord.eggs_collected,
        recordedBy: dbRecord.recorded_by,
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
      };
    }

    if (entityType === 'users') {
      const data: any = {
        id: dbRecord.id,
        displayName: dbRecord.display_name,
        role: dbRecord.role,
        authStatus: dbRecord.auth_status,
        authorizedDevices: JSON.parse(dbRecord.authorized_devices || '[]'),
        isActive: Boolean(dbRecord.is_active),
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
      };

      // Only include optional fields if they have values
      if (dbRecord.invitation_id) {
        data.invitationId = dbRecord.invitation_id;
      }
      if (dbRecord.last_access_at) {
        data.lastAccessAt = dbRecord.last_access_at;
      }

      return data;
    }

    if (entityType === 'audit_logs') {
      return {
        id: dbRecord.id,
        entityType: dbRecord.entity_type,
        entityId: dbRecord.entity_id,
        operationType: dbRecord.operation_type,
        timestamp: dbRecord.timestamp,
        userId: dbRecord.user_id,
        deviceId: dbRecord.device_id,
        synced: Boolean(dbRecord.synced),
      };
    }

    if (entityType === 'chicken_houses') {
      return {
        id: dbRecord.id,
        name: dbRecord.name,
        description: dbRecord.description,
        createdBy: dbRecord.created_by,
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
      };
    }

    if (entityType === 'chicken_lots') {
      return {
        id: dbRecord.id,
        name: dbRecord.name,
        chickenHouseId: dbRecord.chicken_house_id,
        purchaseDate: dbRecord.purchase_date,
        initialHenCount: dbRecord.initial_hen_count,
        liveHenCount: dbRecord.live_hen_count,
        ageWeeks: dbRecord.age_weeks,
        createdBy: dbRecord.created_by,
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
      };
    }

    if (entityType === 'mortality_records') {
      return {
        id: dbRecord.id,
        lotId: dbRecord.lot_id,
        date: dbRecord.date,
        hensDied: dbRecord.hens_died,
        recordedBy: dbRecord.recorded_by,
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
      };
    }

    if (entityType === 'invitations') {
      return {
        id: dbRecord.id,
        userId: dbRecord.user_id,
        token: dbRecord.token,
        status: dbRecord.status,
        expiresAt: dbRecord.expires_at,
        createdBy: dbRecord.created_by,
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
      };
    }

    if (entityType === 'feed_batches') {
      return {
        id: dbRecord.id,
        batchName: dbRecord.batch_name,
        preparationDate: dbRecord.preparation_date,
        quantityKg: dbRecord.quantity_kg,
        preparedBy: dbRecord.prepared_by,
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
      };
    }

    if (entityType === 'feeding_records') {
      return {
        id: dbRecord.id,
        lotId: dbRecord.lot_id,
        feedBatchId: dbRecord.feed_batch_id,
        date: dbRecord.date,
        quantityFedKg: dbRecord.quantity_fed_kg,
        recordedBy: dbRecord.recorded_by,
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
      };
    }

    if (entityType === 'health_events') {
      return {
        id: dbRecord.id,
        lotId: dbRecord.lot_id,
        eventType: dbRecord.event_type,
        eventDate: dbRecord.event_date,
        productName: dbRecord.product_name,
        notes: dbRecord.notes,
        recordedBy: dbRecord.recorded_by,
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
      };
    }

    if (entityType === 'biosecurity_events') {
      return {
        id: dbRecord.id,
        eventType: dbRecord.event_type,
        eventDate: dbRecord.event_date,
        productName: dbRecord.product_name,
        notes: dbRecord.notes,
        recordedBy: dbRecord.recorded_by,
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
      };
    }

    // Fallback: return as-is for unknown types
    return dbRecord;
  }

  /**
   * Gets the last sync timestamp from local database
   * Creates sync_metadata table if it doesn't exist (lazy initialization)
   */
  private async getLastSyncTimestamp(): Promise<string> {
    try {
      // Ensure sync_metadata table exists (lazy initialization for migration compatibility)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      const result = await this.db.getFirstAsync<{ value: string }>(
        `SELECT value FROM sync_metadata WHERE key = 'lastSyncTimestamp'`
      );
      return result?.value || '1970-01-01T00:00:00.000Z';
    } catch (error) {
      console.error('[SyncService] Error getting last sync timestamp:', error);
      return '1970-01-01T00:00:00.000Z';
    }
  }

  /**
   * Updates the last sync timestamp in local database
   * Creates sync_metadata table if it doesn't exist (lazy initialization)
   */
  private async updateLastSyncTimestamp(timestamp: string): Promise<void> {
    try {
      // Ensure sync_metadata table exists (lazy initialization for migration compatibility)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      await this.db.runAsync(
        `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
         VALUES ('lastSyncTimestamp', ?, ?)`,
        [timestamp, new Date().toISOString()]
      );
    } catch (error) {
      console.error('[SyncService] Error updating last sync timestamp:', error);
      throw error;
    }
  }

  /**
   * Downloads updates from Firestore and applies to local DB
   *
   * Process:
   * 1. Query Firestore for documents updated since last sync
   * 2. For each document:
   *    - Check if exists locally
   *    - If exists, apply conflict resolution
   *    - If not exists or remote wins, update local DB
   * 3. Update last sync timestamp
   *
   * @returns Number of documents downloaded
   */
  async downloadUpdates(): Promise<{ downloaded: number; conflicts: number }> {
    let downloadCount = 0;
    let conflictCount = 0;

    // Get last sync timestamp for incremental download
    const lastSyncTimestamp = await this.getLastSyncTimestamp();
    const currentSyncTimestamp = new Date().toISOString();

    // All collection types for comprehensive sync
    const collections = [
      'production_records',
      'mortality_records',
      'users',
      'invitations',
      'chicken_houses',
      'chicken_lots',
      'feed_batches',
      'feeding_records',
      'health_events',
      'biosecurity_events',
      'audit_logs',
    ];

    for (const collectionName of collections) {
      const collectionRef = collection(this.firestore, collectionName);

      // Incremental download: only get documents updated since last sync
      const q = query(
        collectionRef,
        where('updatedAt', '>', lastSyncTimestamp)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        continue;
      }

      for (const docSnapshot of snapshot.docs) {
        if (!docSnapshot.exists()) {
          continue;
        }

        const remoteData = docSnapshot.data();
        const entityType = collectionName;
        const entityId = docSnapshot.id;

        // Check if exists locally
        const localData = await this.readEntityFromLocalDB(entityType, entityId);

        if (localData) {
          // Conflict resolution
          const localDoc = this.convertToFirestoreFormat(entityType, localData);
          const resolution = this.conflictResolver.resolve(
            localDoc as TimestampedDocument,
            remoteData as TimestampedDocument
          );

          if (resolution.winner === 'remote') {
            await this.applyRemoteUpdate(entityType, remoteData);
            conflictCount++;
          }
          // If local wins, do nothing (local is already up-to-date)
        } else {
          // New record, insert
          await this.applyRemoteUpdate(entityType, remoteData);
        }

        downloadCount++;
      }
    }

    // Update last sync timestamp after successful download
    await this.updateLastSyncTimestamp(currentSyncTimestamp);

    return { downloaded: downloadCount, conflicts: conflictCount };
  }

  /**
   * Applies a remote update to local database
   */
  private async applyRemoteUpdate(
    entityType: string,
    remoteData: any
  ): Promise<void> {
    if (entityType === 'production_records') {
      // Convert camelCase to snake_case for SQLite
      await this.db.runAsync(
        `INSERT OR REPLACE INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          remoteData.id,
          remoteData.lotId,
          remoteData.date,
          remoteData.eggsCollected,
          remoteData.recordedBy,
          remoteData.createdAt,
          remoteData.updatedAt,
        ]
      );
      return;
    }

    if (entityType === 'users') {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO users
         (id, display_name, role, auth_status, authorized_devices,
          is_active, invitation_id, last_access_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          remoteData.id,
          remoteData.displayName,
          remoteData.role,
          remoteData.authStatus,
          JSON.stringify(remoteData.authorizedDevices || []),
          remoteData.isActive ? 1 : 0,
          remoteData.invitationId ?? null,
          remoteData.lastAccessAt ?? null,
          remoteData.createdAt,
          remoteData.updatedAt,
        ]
      );
      return;
    }

    if (entityType === 'audit_logs') {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO audit_log_local
         (id, entity_type, entity_id, operation_type, timestamp, user_id, device_id, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          remoteData.id,
          remoteData.entityType,
          remoteData.entityId,
          remoteData.operationType,
          remoteData.timestamp,
          remoteData.userId,
          remoteData.deviceId,
          remoteData.synced ? 1 : 0,
        ]
      );
      return;
    }

    if (entityType === 'chicken_houses') {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO chicken_houses
         (id, name, description, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          remoteData.id,
          remoteData.name,
          remoteData.description ?? null,
          remoteData.createdBy,
          remoteData.createdAt,
          remoteData.updatedAt,
        ]
      );
      return;
    }

    if (entityType === 'chicken_lots') {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO chicken_lots
         (id, name, chicken_house_id, purchase_date, initial_hen_count,
          live_hen_count, age_weeks, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          remoteData.id,
          remoteData.name,
          remoteData.chickenHouseId,
          remoteData.purchaseDate,
          remoteData.initialHenCount,
          remoteData.liveHenCount,
          remoteData.ageWeeks,
          remoteData.createdBy,
          remoteData.createdAt,
          remoteData.updatedAt,
        ]
      );
      return;
    }

    if (entityType === 'mortality_records') {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO mortality_records
         (id, lot_id, date, hens_died, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          remoteData.id,
          remoteData.lotId,
          remoteData.date,
          remoteData.hensDied,
          remoteData.recordedBy,
          remoteData.createdAt,
          remoteData.updatedAt,
        ]
      );
      return;
    }

    if (entityType === 'invitations') {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO invitations
         (id, user_id, token, status, expires_at, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          remoteData.id,
          remoteData.userId,
          remoteData.token,
          remoteData.status,
          remoteData.expiresAt,
          remoteData.createdBy,
          remoteData.createdAt,
          remoteData.updatedAt,
        ]
      );
      return;
    }

    if (entityType === 'feed_batches') {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO feed_batches
         (id, batch_name, preparation_date, quantity_kg, prepared_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          remoteData.id,
          remoteData.batchName,
          remoteData.preparationDate,
          remoteData.quantityKg,
          remoteData.preparedBy,
          remoteData.createdAt,
          remoteData.updatedAt,
        ]
      );
      return;
    }

    if (entityType === 'feeding_records') {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO feeding_records
         (id, lot_id, feed_batch_id, date, quantity_fed_kg, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          remoteData.id,
          remoteData.lotId,
          remoteData.feedBatchId,
          remoteData.date,
          remoteData.quantityFedKg,
          remoteData.recordedBy,
          remoteData.createdAt,
          remoteData.updatedAt,
        ]
      );
      return;
    }

    if (entityType === 'health_events') {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO health_events
         (id, lot_id, event_type, event_date, product_name, notes, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          remoteData.id,
          remoteData.lotId,
          remoteData.eventType,
          remoteData.eventDate,
          remoteData.productName,
          remoteData.notes ?? null,
          remoteData.recordedBy,
          remoteData.createdAt,
          remoteData.updatedAt,
        ]
      );
      return;
    }

    if (entityType === 'biosecurity_events') {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO biosecurity_events
         (id, event_type, event_date, product_name, notes, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          remoteData.id,
          remoteData.eventType,
          remoteData.eventDate,
          remoteData.productName,
          remoteData.notes ?? null,
          remoteData.recordedBy,
          remoteData.createdAt,
          remoteData.updatedAt,
        ]
      );
      return;
    }

    throw new Error(`Unknown entity type: ${entityType}`);
  }

  /**
   * Executes full sync cycle (upload then download) with retry logic
   *
   * @param retryCount Current retry attempt (0 = first attempt)
   * @returns Sync statistics
   */
  async sync(retryCount = 0): Promise<SyncResult> {
    const errors: string[] = [];
    let uploaded = 0;
    let downloaded = 0;
    let conflicts = 0;

    try {
      // Phase 1: Upload pending changes (batch)
      uploaded = await this.batchSync();
    } catch (error) {
      const errorMessage = `Upload failed: ${(error as Error).message}`;
      errors.push(errorMessage);

      // Retry with exponential backoff (max 3 retries)
      if (retryCount < 3) {
        const delayMs = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`[SyncService] Retry ${retryCount + 1}/3 after ${delayMs}ms...`);

        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.sync(retryCount + 1);
      }

      // Max retries exceeded
      throw error;
    }

    try {
      // Phase 2: Download updates
      const downloadResult = await this.downloadUpdates();
      downloaded = downloadResult.downloaded;
      conflicts = downloadResult.conflicts;
    } catch (error) {
      const errorMessage = `Download failed: ${(error as Error).message}`;
      errors.push(errorMessage);

      // Retry download with exponential backoff (max 3 retries)
      if (retryCount < 3) {
        const delayMs = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`[SyncService] Download retry ${retryCount + 1}/3 after ${delayMs}ms...`);

        await new Promise(resolve => setTimeout(resolve, delayMs));

        // Retry only download phase
        try {
          const retryDownload = await this.downloadUpdates();
          downloaded = retryDownload.downloaded;
          conflicts = retryDownload.conflicts;
          // Clear download error if retry succeeds
          errors.pop();
        } catch (retryError) {
          // Download failed even after retry
          errors.push(`Download retry failed: ${(retryError as Error).message}`);
        }
      }
    }

    return {
      uploaded,
      downloaded,
      conflicts,
      errors,
    };
  }
}
