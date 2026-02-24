/**
 * One-Shot Firestore Listeners for Full Sync
 *
 * Two-phase approach to avoid "database table is locked":
 *   Phase 1 – Fetch all Firestore data (no DB writes, no transaction open).
 *   Phase 2 – Write everything inside a single db.withTransactionAsync() so
 *              expo-sqlite's internal lock serialises concurrent DB access.
 *
 * Using a manual `BEGIN TRANSACTION` via execAsync bypasses expo-sqlite's
 * internal locking mechanism and causes "table is locked" when any other
 * async operation (UI load, MortalityService, etc.) tries to access the DB
 * while the transaction is open and Firestore snapshots are being awaited.
 *
 * Usage:
 * ```typescript
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

/** Raw Firestore document (id + data map) */
interface FirestoreDoc {
  id: string;
  data: Record<string, any>;
}

/** Result of Phase 1 for one collection */
interface CollectionSnapshot {
  name: string;
  tableName: string;
  insertSQL: string;
  mapData: (data: any, docId: string) => any[];
  docs: FirestoreDoc[];
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
      data.createdBy ?? data.created_by,
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
      data.batchName ?? data.batch_name,
      data.preparationDate ?? data.preparation_date,
      data.quantityKg ?? data.quantity_kg,
      data.preparedBy ?? data.prepared_by,
      data.createdAt ?? data.created_at,
      data.updatedAt ?? data.updated_at,
    ],
    insertSQL: `INSERT OR REPLACE INTO feed_batches
      (id, batch_name, preparation_date, quantity_kg, prepared_by, created_at, updated_at)
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

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches ONE Firestore collection as a one-shot listener (no DB writes).
 * Unsubscribes immediately upon receiving the first snapshot.
 */
function fetchFirestoreCollection(
  config: (typeof COLLECTIONS)[0]
): Promise<CollectionSnapshot> {
  return new Promise((resolve, reject) => {
    const collectionRef = collection(firestore, config.name);
    let done = false;
    let unsubscribe: Unsubscribe;

    const timeoutId = setTimeout(() => {
      if (done) return;
      done = true;
      if (unsubscribe) unsubscribe();
      reject(new Error(`Timeout fetching ${config.name}`));
    }, 30_000);

    unsubscribe = onSnapshot(
      collectionRef,
      { includeMetadataChanges: false },
      (snapshot) => {
        if (done) return;
        done = true;
        clearTimeout(timeoutId);
        try {
          unsubscribe();
        } catch {
          // noop
        }
        resolve({
          name: config.name,
          tableName: config.tableName,
          insertSQL: config.insertSQL,
          mapData: config.mapData,
          docs: snapshot.docs.map((d) => ({ id: d.id, data: d.data() })),
        });
      },
      (error) => {
        if (done) return;
        done = true;
        clearTimeout(timeoutId);
        if (unsubscribe) unsubscribe();
        reject(error);
      }
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executes one-shot sync for all collections using Firestore listeners.
 *
 * Collections are fetched in dependency order to respect FK constraints:
 *   Level 1 – users
 *   Level 2 – invitations, chicken_houses, feed_batches, biosecurity_events
 *   Level 3 – chicken_lots
 *   Level 4 – production_records, mortality_records, feeding_records, health_events
 *
 * @param detectDeletions Whether to delete local records absent from Firestore (default true)
 */
export async function syncWithListeners(
  detectDeletions = true
): Promise<SyncResult[]> {
  const mode = detectDeletions
    ? 'FULL SYNC (with deletions)'
    : 'FAST SYNC (inserts/updates only)';
  console.log(`[SyncListeners] Starting ${mode} for all collections...`);

  const startTime = Date.now();
  const db = getDatabase();

  // ── Ensure optional tables exist (lazy migration for v4→v5) ──────────────
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

  // ── PHASE 1: Fetch all Firestore data (NO DB writes, NO transaction) ──────
  // Firestore I/O happens here while the DB is free for other operations.
  // Collections are fetched sequentially to maintain dependency order.
  const level1Config = COLLECTIONS.find((c) => c.name === 'users')!;
  const level2Configs = COLLECTIONS.filter((c) =>
    ['invitations', 'chicken_houses', 'feed_batches', 'biosecurity_events'].includes(c.name)
  );
  const level3Config = COLLECTIONS.find((c) => c.name === 'chicken_lots')!;
  const level4Configs = COLLECTIONS.filter((c) =>
    ['production_records', 'mortality_records', 'feeding_records', 'health_events'].includes(c.name)
  );

  const orderedConfigs = [
    level1Config,
    ...level2Configs,
    level3Config,
    ...level4Configs,
  ];

  const snapshots: CollectionSnapshot[] = [];
  for (const config of orderedConfigs) {
    snapshots.push(await fetchFirestoreCollection(config));
  }

  // Log fetch counts for visibility
  for (const snap of snapshots) {
    console.log(`[SyncListeners] Fetched ${snap.name}: ${snap.docs.length} docs`);
  }

  // ── If deletions needed, read current local IDs BEFORE the transaction ────
  let localIds: Map<string, Set<string>> | null = null;
  if (detectDeletions) {
    localIds = new Map();
    for (const snap of snapshots) {
      const rows = await db.getAllAsync<{ id: string }>(
        `SELECT id FROM ${snap.tableName}`
      );
      localIds.set(snap.name, new Set(rows.map((r) => r.id)));
    }
  }

  // ── PHASE 2: Write all data inside a proper withTransactionAsync ──────────
  // Using withTransactionAsync instead of manual BEGIN/COMMIT ensures expo-sqlite's
  // internal lock serialises our writes against any concurrent DB access.
  const allResults: SyncResult[] = [];

  // PRAGMA foreign_keys must be set outside the transaction
  await db.execAsync('PRAGMA foreign_keys = OFF');
  console.log('[SyncListeners] Foreign keys disabled for sync');

  try {
    await db.withTransactionAsync(async () => {
      for (const snap of snapshots) {
        const result: SyncResult = {
          collection: snap.name,
          added: 0,
          modified: 0,
          removed: 0,
        };

        const firestoreIds = new Set<string>();

        for (const doc of snap.docs) {
          const params = snap.mapData(doc.data, doc.id);
          await db.runAsync(snap.insertSQL, params);
          result.added++;
          firestoreIds.add(doc.id);
        }

        if (detectDeletions && localIds) {
          const local = localIds.get(snap.name) ?? new Set<string>();
          for (const id of local) {
            if (!firestoreIds.has(id)) {
              await db.runAsync(
                `DELETE FROM ${snap.tableName} WHERE id = ?`,
                [id]
              );
              result.removed++;
            }
          }
        }

        console.log(
          `[SyncListeners] ${snap.name}: +${result.added} ~${result.modified} -${result.removed}`
        );
        allResults.push(result);
      }
    });

    // Re-enable FK constraints after successful commit
    await db.execAsync('PRAGMA foreign_keys = ON');
    console.log('[SyncListeners] Foreign keys re-enabled');

    const totalTime = Date.now() - startTime;
    const totals = allResults.reduce(
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

    return allResults;
  } catch (error) {
    console.error('[SyncListeners] ❌ Sync failed:', error);

    // Re-enable FK constraints even on error
    try {
      await db.execAsync('PRAGMA foreign_keys = ON');
      console.log('[SyncListeners] Foreign keys re-enabled after error');
    } catch (fkError) {
      console.error('[SyncListeners] Failed to re-enable foreign keys:', fkError);
    }

    throw error;
  }
}
