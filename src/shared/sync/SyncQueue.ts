/**
 * SyncQueue Service
 *
 * Manages the local sync queue for offline operations.
 * Queues CREATE, UPDATE, and DELETE operations to be synced with the server.
 *
 * NOTE: This queue stores only references to entities (entity_type + entity_id),
 * not the actual data payloads. The actual data is stored in the respective tables
 * (production_records, mortality_records, etc.) and retrieved when syncing.
 *
 * Usage:
 * ```typescript
 * import { SyncQueue } from '@/shared/sync/SyncQueue';
 * import { getDatabase } from '@/shared/database';
 *
 * const db = getDatabase();
 * const syncQueue = new SyncQueue(db);
 *
 * // Add operation to queue (only reference, no data payload)
 * await syncQueue.enqueue({
 *   entityType: 'production_records',
 *   entityId: 'prod-123',
 *   operation: 'CREATE'
 * });
 *
 * // Get pending operations
 * const pending = await syncQueue.getPending();
 *
 * // Mark as synced
 * await syncQueue.markSynced(pending[0].id);
 * ```
 */

import * as SQLite from 'expo-sqlite';
import { generateId } from '@/shared/utils/id';

/**
 * Sync operation types
 */
export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';

/**
 * Queue operation to enqueue
 */
export interface QueueOperation {
  entityType: string;
  entityId: string;
  operation: SyncOperation;
}

/**
 * Queue record from database
 */
export interface QueueRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  operation: SyncOperation;
  local_timestamp: string;
  synced_at: string | null;
  retry_count: number;
  error: string | null;
}

/**
 * SyncQueue service for managing offline sync operations
 */
export class SyncQueue {
  constructor(private db: SQLite.SQLiteDatabase) {}

  /**
   * Adds an operation to the sync queue
   *
   * @param operation Operation to enqueue
   */
  async enqueue(operation: QueueOperation): Promise<void> {
    const id = generateId();
    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, local_timestamp, retry_count)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [id, operation.entityType, operation.entityId, operation.operation, now]
    );
  }

  /**
   * Gets all pending (not synced) operations from the queue
   *
   * @param limit Optional limit of operations to return
   * @returns Array of pending queue records, ordered by local_timestamp (FIFO)
   */
  async getPending(limit?: number): Promise<QueueRecord[]> {
    const sql = `
      SELECT * FROM sync_queue
      WHERE synced_at IS NULL
      ORDER BY local_timestamp ASC
      ${limit ? `LIMIT ${limit}` : ''}
    `;

    return await this.db.getAllAsync<QueueRecord>(sql);
  }

  /**
   * Marks a queue operation as synced
   *
   * @param queueId Queue record ID to mark as synced
   */
  async markSynced(queueId: string): Promise<void> {
    const now = new Date().toISOString();

    await this.db.runAsync(
      `UPDATE sync_queue
       SET synced_at = ?
       WHERE id = ?`,
      [now, queueId]
    );
  }

  /**
   * Gets the count of pending operations
   *
   * @returns Number of pending operations
   */
  async getPendingCount(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue WHERE synced_at IS NULL'
    );

    return result?.count ?? 0;
  }

  /**
   * Removes all synced operations from the queue
   *
   * Used for cleanup after successful sync.
   */
  async clearSynced(): Promise<void> {
    await this.db.runAsync('DELETE FROM sync_queue WHERE synced_at IS NOT NULL');
  }

  /**
   * Gets all pending entity IDs for a specific entity type
   *
   * Efficient batch query to check multiple entities at once.
   * Use this instead of checking each entity individually.
   *
   * @param entityType Entity type to check (e.g., 'users', 'production_records')
   * @returns Set of entity IDs that have pending changes
   */
  async getPendingEntityIds(entityType: string): Promise<Set<string>> {
    const records = await this.db.getAllAsync<{ entity_id: string }>(
      `SELECT DISTINCT entity_id FROM sync_queue
       WHERE synced_at IS NULL AND entity_type = ?`,
      [entityType]
    );

    return new Set(records.map(r => r.entity_id));
  }
}
