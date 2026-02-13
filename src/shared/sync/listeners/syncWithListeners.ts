/**
 * One-Shot Firestore Listeners for Full Sync
 *
 * Executes all Firestore listeners ONCE to download complete state,
 * then automatically unsubscribes. This hybrid approach:
 * - Detects deletions (which regular queries can't)
 * - Downloads full state efficiently
 * - Doesn't keep persistent connections (saves battery)
 *
 * Usage:
 * ```typescript
 * import { syncWithListeners } from '@/shared/sync/listeners/syncWithListeners';
 *
 * // On app open or pull-to-refresh
 * await syncWithListeners();
 * ```
 */

import { collection, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { firestore } from '@/core/config/firebase';
import { getDatabase } from '@/shared/database';

interface SyncResult {
  collection: string;
  added: number;
  modified: number;
  removed: number;
}

/**
 * Collection configurations for sync
 */
const COLLECTIONS = [
  {
    name: 'users',
    tableName: 'users',
    mapData: (data: any, docId: string) => [
      docId,
      data.displayName,
      data.role,
      data.authStatus,
      JSON.stringify(data.authorizedDevices || []),
      data.isActive ? 1 : 0,
      data.invitationId ?? null,
      data.lastAccessAt ?? null,
      data.createdAt,
      data.updatedAt,
    ],
    insertSQL: `INSERT OR REPLACE INTO users
      (id, display_name, role, auth_status, authorized_devices,
       is_active, invitation_id, last_access_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  },
  {
    name: 'invitations',
    tableName: 'invitations',
    mapData: (data: any, docId: string) => [
      docId,
      data.userId,
      data.token,
      data.status,
      data.expiresAt,
      data.createdBy,
      data.createdAt,
      data.updatedAt,
    ],
    insertSQL: `INSERT OR REPLACE INTO invitations
      (id, user_id, token, status, expires_at, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  },
  {
    name: 'chicken_houses',
    tableName: 'chicken_houses',
    mapData: (data: any, docId: string) => [
      docId,
      data.name,
      data.description ?? null,
      data.createdBy,
      data.createdAt,
      data.updatedAt,
    ],
    insertSQL: `INSERT OR REPLACE INTO chicken_houses
      (id, name, description, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
  },
  {
    name: 'chicken_lots',
    tableName: 'chicken_lots',
    mapData: (data: any, docId: string) => [
      docId,
      data.name,
      data.chickenHouseId,
      data.purchaseDate,
      data.initialHenCount,
      data.liveHenCount,
      data.ageWeeks,
      data.createdBy,
      data.createdAt,
      data.updatedAt,
    ],
    insertSQL: `INSERT OR REPLACE INTO chicken_lots
      (id, name, chicken_house_id, purchase_date, initial_hen_count,
       live_hen_count, age_weeks, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  },
  {
    name: 'production_records',
    tableName: 'production_records',
    mapData: (data: any, docId: string) => [
      docId,
      data.lotId,
      data.date,
      data.eggsCollected,
      data.recordedBy,
      data.createdAt,
      data.updatedAt,
    ],
    insertSQL: `INSERT OR REPLACE INTO production_records
      (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
  },
  {
    name: 'mortality_records',
    tableName: 'mortality_records',
    mapData: (data: any, docId: string) => [
      docId,
      data.lotId,
      data.date,
      data.hensDied,
      data.recordedBy,
      data.createdAt,
      data.updatedAt,
    ],
    insertSQL: `INSERT OR REPLACE INTO mortality_records
      (id, lot_id, date, hens_died, recorded_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
  },
  {
    name: 'feed_batches',
    tableName: 'feed_batches',
    mapData: (data: any, docId: string) => [
      docId,
      data.name,
      data.preparationDate,
      data.quantityKg,
      data.createdBy,
      data.createdAt,
      data.updatedAt,
    ],
    insertSQL: `INSERT OR REPLACE INTO feed_batches
      (id, name, preparation_date, quantity_kg, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
  },
  {
    name: 'feeding_records',
    tableName: 'feeding_records',
    mapData: (data: any, docId: string) => [
      docId,
      data.lotId,
      data.feedBatchId,
      data.date,
      data.quantityFedKg,
      data.recordedBy,
      data.createdAt,
      data.updatedAt,
    ],
    insertSQL: `INSERT OR REPLACE INTO feeding_records
      (id, lot_id, feed_batch_id, date, quantity_fed_kg, recorded_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  },
  {
    name: 'health_events',
    tableName: 'health_events',
    mapData: (data: any, docId: string) => [
      docId,
      data.lotId,
      data.eventType,
      data.eventDate,
      data.productName,
      data.notes ?? null,
      data.recordedBy,
      data.createdAt,
      data.updatedAt,
    ],
    insertSQL: `INSERT OR REPLACE INTO health_events
      (id, lot_id, event_type, event_date, product_name, notes, recorded_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  },
  {
    name: 'biosecurity_events',
    tableName: 'biosecurity_events',
    mapData: (data: any, docId: string) => [
      docId,
      data.eventType,
      data.eventDate,
      data.productName,
      data.notes ?? null,
      data.recordedBy,
      data.createdAt,
      data.updatedAt,
    ],
    insertSQL: `INSERT OR REPLACE INTO biosecurity_events
      (id, event_type, event_date, product_name, notes, recorded_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  },
];

/**
 * Syncs a single collection using one-shot listener
 */
function syncCollection(
  collectionConfig: typeof COLLECTIONS[0]
): Promise<SyncResult> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const collectionRef = collection(firestore, collectionConfig.name);

    let unsubscribe: Unsubscribe;
    const result: SyncResult = {
      collection: collectionConfig.name,
      added: 0,
      modified: 0,
      removed: 0,
    };

    const timeoutId = setTimeout(() => {
      if (unsubscribe) unsubscribe();
      reject(new Error(`Timeout syncing ${collectionConfig.name}`));
    }, 30000); // 30s timeout

    unsubscribe = onSnapshot(
      collectionRef,
      async (snapshot) => {
        try {
          // Process all changes
          for (const change of snapshot.docChanges()) {
            const doc = change.doc;
            const data = doc.data();

            if (change.type === 'added' || change.type === 'modified') {
              const params = collectionConfig.mapData(data, doc.id);
              await db.runAsync(collectionConfig.insertSQL, params);
              result[change.type]++;
            } else if (change.type === 'removed') {
              await db.runAsync(
                `DELETE FROM ${collectionConfig.tableName} WHERE id = ?`,
                [doc.id]
              );
              result.removed++;
            }
          }

          // Unsubscribe immediately after processing
          clearTimeout(timeoutId);
          unsubscribe();

          console.log(
            `[SyncListeners] ${collectionConfig.name}: +${result.added} ~${result.modified} -${result.removed}`
          );

          resolve(result);
        } catch (error) {
          clearTimeout(timeoutId);
          unsubscribe();
          reject(error);
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        if (unsubscribe) unsubscribe();
        reject(error);
      }
    );
  });
}

/**
 * Executes one-shot sync for all collections using Firestore listeners
 *
 * This function:
 * 1. Starts listeners for all collections
 * 2. Waits for initial snapshot (full download)
 * 3. Processes added/modified/removed documents
 * 4. Automatically unsubscribes
 * 5. Returns sync statistics
 *
 * @returns Promise with sync results for all collections
 */
export async function syncWithListeners(): Promise<SyncResult[]> {
  console.log('[SyncListeners] Starting one-shot sync for all collections...');

  const startTime = Date.now();

  try {
    // Sync all collections in parallel
    const results = await Promise.all(
      COLLECTIONS.map((config) => syncCollection(config))
    );

    const totalTime = Date.now() - startTime;
    const totals = results.reduce(
      (acc, r) => ({
        added: acc.added + r.added,
        modified: acc.modified + r.modified,
        removed: acc.removed + r.removed,
      }),
      { added: 0, modified: 0, removed: 0 }
    );

    console.log(
      `[SyncListeners] ✅ Sync complete in ${totalTime}ms: ` +
        `+${totals.added} ~${totals.modified} -${totals.removed}`
    );

    return results;
  } catch (error) {
    console.error('[SyncListeners] ❌ Sync failed:', error);
    throw error;
  }
}
