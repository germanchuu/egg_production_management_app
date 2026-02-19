/**
 * onChickenLotCreated Firestore Trigger (T112)
 *
 * Triggers when a new chicken lot is created in Firestore.
 * Writes an audit log entry for lot creation.
 *
 * Trigger: firestore.onDocumentCreated("chicken_lots/{lotId}")
 */

import * as functions from "firebase-functions/v2/firestore";
import {writeAuditLog} from "../common/helpers/auditHelper";

interface ChickenLot {
  id: string;
  house_id?: string;
  name?: string;
  initial_hen_count?: number;
  created_by?: string;
}

/**
 * Firestore trigger: audit log when a chicken lot is created
 */
export const onChickenLotCreated = functions.onDocumentCreated(
  "chicken_lots/{lotId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.warn("onChickenLotCreated: no data in event snapshot");
      return;
    }

    const lot = snapshot.data() as ChickenLot;
    const lotId = event.params.lotId;

    try {
      await writeAuditLog({
        action: "lot_created",
        entityType: "chicken_lots",
        entityId: lotId,
        performedBy: lot.created_by ?? "system",
        details: {
          lotId,
          name: lot.name ?? "unknown",
          houseId: lot.house_id ?? "unknown",
          initialHenCount: lot.initial_hen_count ?? 0,
        },
      });

      console.log(`onChickenLotCreated: audit log written for lot ${lotId}`);
    } catch (error: any) {
      console.error(
        `onChickenLotCreated: failed to write audit log for lot ${lotId}`,
        error.message
      );
    }
  }
);
