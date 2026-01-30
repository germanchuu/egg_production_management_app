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
 * import { getFirestore } from '@/core/config/firebase';
 *
 * const db = getDatabase();
 * const firestore = getFirestore();
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
import { SyncQueue, QueueRecord, SyncOperation } from './SyncQueue';
import { ConflictResolver, TimestampedDocument } from './ConflictResolver';

/**
 * Firestore interface (minimal subset we use)
 */
export interface Firestore {
  collection(path: string): CollectionReference;
}

export interface CollectionReference {
  doc(id: string): DocumentReference;
  where(field: string, op: string, value: any): Query;
}

export interface DocumentReference {
  get(): Promise<DocumentSnapshot>;
  set(data: any): Promise<void>;
  delete(): Promise<void>;
}

export interface DocumentSnapshot {
  exists(): boolean;
  data(): any;
  id: string;
}

export interface Query {
  get(): Promise<QuerySnapshot>;
}

export interface QuerySnapshot {
  docs: DocumentSnapshot[];
  empty: boolean;
}

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
};

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
   * Uploads all pending local changes to Firestore
   *
   * Process:
   * 1. Get pending operations from sync queue
   * 2. For each operation:
   *    - Read entity data from local DB
   *    - Upload to Firestore (CREATE/UPDATE/DELETE)
   *    - Mark as synced in queue
   *
   * @throws Error if upload fails
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

    const collection = this.firestore.collection(collectionName);
    const docRef = collection.doc(entity_id);

    if (operation === 'DELETE') {
      await docRef.delete();
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

    await docRef.set(firestoreData);
  }

  /**
   * Reads entity data from local SQLite database
   */
  private async readEntityFromLocalDB(
    entityType: string,
    entityId: string
  ): Promise<any> {
    const tableName = entityType; // Same as collection name
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

    // Add more entity type conversions as needed
    // For now, return as-is for other types
    return dbRecord;
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
   *
   * @returns Number of documents downloaded
   */
  async downloadUpdates(): Promise<{ downloaded: number; conflicts: number }> {
    let downloadCount = 0;
    let conflictCount = 0;

    // For now, download production_records only
    // In full implementation, iterate over all collection types
    const collections = ['production_records'];

    for (const collectionName of collections) {
      const collection = this.firestore.collection(collectionName);

      // TODO: Add timestamp filtering: where('updatedAt', '>', lastSyncTimestamp)
      // For now, get all documents (will implement timestamp tracking later)
      const query = collection.where('updatedAt', '>', '1970-01-01T00:00:00.000Z');
      const snapshot = await query.get();

      if (snapshot.empty) {
        continue;
      }

      for (const doc of snapshot.docs) {
        if (!doc.exists()) {
          continue;
        }

        const remoteData = doc.data();
        const entityType = collectionName;
        const entityId = doc.id;

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
    }

    // Add more entity types as needed
  }

  /**
   * Executes full sync cycle (upload then download)
   *
   * @returns Sync statistics
   */
  async sync(): Promise<SyncResult> {
    const errors: string[] = [];
    let uploaded = 0;
    let downloaded = 0;
    let conflicts = 0;

    try {
      // Phase 1: Upload pending changes
      uploaded = await this.uploadPendingChanges();
    } catch (error) {
      errors.push(`Upload failed: ${(error as Error).message}`);
      throw error; // Stop sync on upload failure
    }

    try {
      // Phase 2: Download updates
      const downloadResult = await this.downloadUpdates();
      downloaded = downloadResult.downloaded;
      conflicts = downloadResult.conflicts;
    } catch (error) {
      errors.push(`Download failed: ${(error as Error).message}`);
    }

    return {
      uploaded,
      downloaded,
      conflicts,
      errors,
    };
  }
}
