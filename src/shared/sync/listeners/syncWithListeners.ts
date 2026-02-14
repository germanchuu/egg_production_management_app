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
      data.displayName ?? data.display_name,
      data.role,
      data.authStatus ?? data.auth_status,
      JSON.stringify(data.authorizedDevices ?? data.authorized_devices ?? []),
      (data.isActive ?? data.is_active) ? 1 : 0,
      data.invitationId ?? data.invitation_id ?? null,
      data.lastAccessAt ?? data.last_access_at ?? null,
      data.createdAt ?? data.created_at,
      data.updatedAt ?? data.updated_at,
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
      data.userId ?? data.user_id,
      data.token,
      data.status,
      data.expiresAt ?? data.expires_at,
      data.createdBy ?? data.created_by,
      data.createdAt ?? data.created_at,
      data.updatedAt ?? data.updated_at,
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
      data.createdBy ?? data.created_by, // Support both camelCase and snake_case
      data.createdAt ?? data.created_at,
      data.updatedAt ?? data.updated_at,
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
      data.chickenHouseId ?? data.chicken_house_id,
      data.purchaseDate ?? data.purchase_date,
      data.initialHenCount ?? data.initial_hen_count,
      data.liveHenCount ?? data.live_hen_count,
      data.ageWeeks ?? data.age_weeks,
      data.createdBy ?? data.created_by,
      data.createdAt ?? data.created_at,
      data.updatedAt ?? data.updated_at,
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
      data.lotId ?? data.lot_id,
      data.date,
      data.eggsCollected ?? data.eggs_collected,
      data.recordedBy ?? data.recorded_by,
      data.createdAt ?? data.created_at,
      data.updatedAt ?? data.updated_at,
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
      data.lotId ?? data.lot_id,
      data.date,
      data.hensDied ?? data.hens_died,
      data.recordedBy ?? data.recorded_by,
      data.createdAt ?? data.created_at,
      data.updatedAt ?? data.updated_at,
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
      data.preparationDate ?? data.preparation_date,
      data.quantityKg ?? data.quantity_kg,
      data.createdBy ?? data.created_by,
      data.createdAt ?? data.created_at,
      data.updatedAt ?? data.updated_at,
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
      data.lotId ?? data.lot_id,
      data.feedBatchId ?? data.feed_batch_id,
      data.date,
      data.quantityFedKg ?? data.quantity_fed_kg,
      data.recordedBy ?? data.recorded_by,
      data.createdAt ?? data.created_at,
      data.updatedAt ?? data.updated_at,
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
      data.lotId ?? data.lot_id,
      data.eventType ?? data.event_type,
      data.eventDate ?? data.event_date,
      data.productName ?? data.product_name,
      data.notes ?? null,
      data.recordedBy ?? data.recorded_by,
      data.createdAt ?? data.created_at,
      data.updatedAt ?? data.updated_at,
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
      data.eventType ?? data.event_type,
      data.eventDate ?? data.event_date,
      data.productName ?? data.product_name,
      data.notes ?? null,
      data.recordedBy ?? data.recorded_by,
      data.createdAt ?? data.created_at,
      data.updatedAt ?? data.updated_at,
    ],
    insertSQL: `INSERT OR REPLACE INTO biosecurity_events
      (id, event_type, event_date, product_name, notes, recorded_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  },
];

/**
 * Syncs a single collection using one-shot listener
 *
 * @param collectionConfig Collection configuration
 * @param db Database instance
 * @param detectDeletions Whether to detect and delete removed documents
 */
function syncCollection(
  collectionConfig: typeof COLLECTIONS[0],
  db: any,
  detectDeletions: boolean
): Promise<SyncResult> {
  return new Promise((resolve, reject) => {
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
      { includeMetadataChanges: false }, // Force server read, ignore cache
      async (snapshot) => {
        try {
          const tempTableName = `temp_sync_${collectionConfig.tableName}`;

          // Create temporary table for Firestore IDs
          await db.execAsync(
            `CREATE TEMP TABLE IF NOT EXISTS ${tempTableName} (id TEXT PRIMARY KEY)`
          );

          // Clear temp table in case it exists from a previous failed sync
          await db.execAsync(`DELETE FROM ${tempTableName}`);

          // Insert all Firestore document IDs and upsert records
          for (const doc of snapshot.docs) {
            const data = doc.data();
            const params = collectionConfig.mapData(data, doc.id);

            // Upsert the document
            await db.runAsync(collectionConfig.insertSQL, params);
            result.added++;

            // Track this ID in temp table
            await db.runAsync(
              `INSERT OR IGNORE INTO ${tempTableName} (id) VALUES (?)`,
              [doc.id]
            );
          }

          // Detect deletions only if requested (deep refresh mode)
          if (detectDeletions) {
            // Efficiently delete all local records NOT in Firestore using temp table
            // This is O(M + N) instead of O(M×N) and has no placeholder limit
            const deleteResult = await db.runAsync(
              `DELETE FROM ${collectionConfig.tableName}
               WHERE id NOT IN (SELECT id FROM ${tempTableName})`
            );
            result.removed = deleteResult.changes;
          }

          // Clean up temp table
          await db.execAsync(`DROP TABLE IF EXISTS ${tempTableName}`);

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
 * 1. Starts listeners for all collections IN DEPENDENCY ORDER
 * 2. Waits for initial snapshot (full download)
 * 3. Processes added/modified documents (always)
 * 4. Processes removed documents (only if detectDeletions = true)
 * 5. Automatically unsubscribes
 * 6. Returns sync statistics
 *
 * Collections are synced in order to respect foreign key constraints:
 * - Level 1: users (no dependencies)
 * - Level 2: invitations, chicken_houses, feed_batches (depend on users)
 * - Level 3: chicken_lots (depends on chicken_houses)
 * - Level 4: production_records, mortality_records, feeding_records, health_events, biosecurity_events
 *
 * @param detectDeletions Whether to detect and delete removed documents (default: true for backward compatibility)
 * @returns Promise with sync results for all collections
 */
export async function syncWithListeners(detectDeletions = true): Promise<SyncResult[]> {
  const mode = detectDeletions ? 'FULL SYNC (with deletions)' : 'FAST SYNC (inserts/updates only)';
  console.log(`[SyncListeners] Starting ${mode} for all collections...`);

  const startTime = Date.now();
  const db = getDatabase();

  try {
    // IMPORTANT: Disable foreign keys BEFORE starting transaction
    // PRAGMA statements cannot be executed inside a transaction
    await db.execAsync('PRAGMA foreign_keys = OFF');
    console.log('[SyncListeners] Foreign keys disabled for sync');

    // Ensure all tables exist (lazy initialization for v4→v5 migration)
    // This handles cases where app is running with old DB version
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS health_events (
        id TEXT PRIMARY KEY,
        lot_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_date TEXT NOT NULL,
        product_name TEXT NOT NULL,
        notes TEXT,
        recorded_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (lot_id) REFERENCES chicken_lots(id),
        FOREIGN KEY (recorded_by) REFERENCES users(id)
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS biosecurity_events (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        event_date TEXT NOT NULL,
        product_name TEXT NOT NULL,
        notes TEXT,
        recorded_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (recorded_by) REFERENCES users(id)
      );
    `);

    console.log('[SyncListeners] Tables verified/created');

    // Begin transaction for all sync operations (major performance boost)
    await db.execAsync('BEGIN TRANSACTION');
    console.log('[SyncListeners] Transaction started');

    const allResults: SyncResult[] = [];

    // Level 1: Users (no dependencies)
    const usersConfig = COLLECTIONS.find((c) => c.name === 'users')!;
    allResults.push(await syncCollection(usersConfig, db, detectDeletions));

    // Level 2: Collections that depend only on users (can run in parallel)
    const level2Configs = COLLECTIONS.filter((c) =>
      ['invitations', 'chicken_houses', 'feed_batches', 'biosecurity_events'].includes(c.name)
    );
    const level2Results = await Promise.all(
      level2Configs.map((config) => syncCollection(config, db, detectDeletions))
    );
    allResults.push(...level2Results);

    // Level 3: chicken_lots (depends on chicken_houses)
    const lotsConfig = COLLECTIONS.find((c) => c.name === 'chicken_lots')!;
    allResults.push(await syncCollection(lotsConfig, db, detectDeletions));

    // Level 4: Collections that depend on lots (can run in parallel)
    const level4Configs = COLLECTIONS.filter((c) =>
      ['production_records', 'mortality_records', 'feeding_records', 'health_events'].includes(c.name)
    );
    const level4Results = await Promise.all(
      level4Configs.map((config) => syncCollection(config, db, detectDeletions))
    );
    allResults.push(...level4Results);

    const totalTime = Date.now() - startTime;
    const totals = allResults.reduce(
      (acc, r) => ({
        added: acc.added + r.added,
        modified: acc.modified + r.modified,
        removed: acc.removed + r.removed,
      }),
      { added: 0, modified: 0, removed: 0 }
    );

    // Commit all changes at once (writes to disk in one operation)
    await db.execAsync('COMMIT');
    console.log('[SyncListeners] Transaction committed');

    // IMPORTANT: Re-enable foreign keys AFTER committing transaction
    // PRAGMA statements cannot be executed inside a transaction
    await db.execAsync('PRAGMA foreign_keys = ON');
    console.log('[SyncListeners] Foreign keys re-enabled');

    console.log(
      `[SyncListeners] ✅ Sync complete in ${totalTime}ms: ` +
        `+${totals.added} ~${totals.modified} -${totals.removed}`
    );

    return allResults;
  } catch (error) {
    console.error('[SyncListeners] ❌ Sync failed:', error);

    // Rollback transaction on error (must be before PRAGMA)
    try {
      await db.execAsync('ROLLBACK');
      console.log('[SyncListeners] Transaction rolled back');
    } catch (rollbackError) {
      console.error('[SyncListeners] Failed to rollback transaction:', rollbackError);
    }

    // Re-enable foreign key constraints after rollback (PRAGMA must be outside transaction)
    try {
      await db.execAsync('PRAGMA foreign_keys = ON');
      console.log('[SyncListeners] Foreign keys re-enabled after error');
    } catch (fkError) {
      console.error('[SyncListeners] Failed to re-enable foreign keys:', fkError);
    }

    throw error;
  }
}
