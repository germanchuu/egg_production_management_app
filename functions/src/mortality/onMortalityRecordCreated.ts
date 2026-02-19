/**
 * onMortalityRecordCreated Firestore Trigger (T110)
 *
 * Triggers when a new mortality record is created in Firestore.
 * Atomically updates the lot's liveHenCount on the server side.
 *
 * This ensures server-side consistency even when the client updates
 * may be delayed or out of order.
 *
 * Trigger: firestore.onDocumentCreated("mortality_records/{recordId}")
 */

import * as functions from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

interface MortalityRecord {
  lot_id: string;
  hens_died: number;
  date: string;
  recorded_by?: string;
}

/**
 * Firestore trigger: atomically update lot liveHenCount when mortality record is created
 */
export const onMortalityRecordCreated = functions.onDocumentCreated(
  "mortality_records/{recordId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.warn("onMortalityRecordCreated: no data in event snapshot");
      return;
    }

    const record = snapshot.data() as MortalityRecord;
    const recordId = event.params.recordId;

    // Validate required fields
    if (!record.lot_id || typeof record.hens_died !== "number") {
      console.error(
        `onMortalityRecordCreated: invalid record ${recordId}`,
        record
      );
      return;
    }

    const db = admin.firestore();
    const lotRef = db.collection("chicken_lots").doc(record.lot_id);

    try {
      await db.runTransaction(async (transaction) => {
        const lotSnap = await transaction.get(lotRef);

        if (!lotSnap.exists) {
          throw new Error(
            `Lot not found: ${record.lot_id} for mortality record ${recordId}`
          );
        }

        const lotData = lotSnap.data()!;
        const currentLiveHenCount: number = lotData.live_hen_count ?? 0;

        if (record.hens_died > currentLiveHenCount) {
          throw new Error(
            `Cannot record ${record.hens_died} deaths: only ${currentLiveHenCount} hens alive in lot ${record.lot_id}`
          );
        }

        const newLiveHenCount = currentLiveHenCount - record.hens_died;

        transaction.update(lotRef, {
          live_hen_count: newLiveHenCount,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Write audit log if mortality rate > 10%
        const mortalityRate = currentLiveHenCount > 0
          ? (record.hens_died / currentLiveHenCount) * 100
          : 0;

        if (mortalityRate > 10) {
          const auditRef = db.collection("audit_log").doc();
          transaction.set(auditRef, {
            action: "high_mortality_detected",
            entityType: "mortality_records",
            entityId: recordId,
            performedBy: record.recorded_by ?? "system",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            details: {
              lotId: record.lot_id,
              hensDied: record.hens_died,
              previousLiveCount: currentLiveHenCount,
              newLiveCount: newLiveHenCount,
              mortalityRate: mortalityRate.toFixed(2),
              date: record.date,
            },
          });
        }
      });

      console.log(
        `onMortalityRecordCreated: updated lot ${record.lot_id} — ` +
          `-${record.hens_died} hens (record ${recordId})`
      );
    } catch (error: any) {
      console.error(
        `onMortalityRecordCreated: failed to update lot ${record.lot_id}`,
        error.message
      );
      // Re-throw to trigger Cloud Functions retry
      throw error;
    }
  }
);
