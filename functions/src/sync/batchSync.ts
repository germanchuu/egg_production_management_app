/**
 * batchSync Firebase Function (T111)
 *
 * Handles batch uploads from mobile clients.
 * Accepts up to 500 records per request and writes them to Firestore using batch writes.
 *
 * This is the server-side complement to SyncService.batchSync() on the client.
 *
 * Request body:
 * {
 *   userId: string;
 *   deviceId: string;
 *   records: SyncRecord[];
 * }
 *
 * Response:
 * {
 *   success: true;
 *   processed: number;
 *   errors: string[];
 * }
 */

import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
  handleCorsAndMethod,
  parseBody,
  sendError,
  sendSuccess,
} from "../common/helpers/httpHelpers";
import {fail} from "../common/types/result";

/** Maximum records per batch request */
const MAX_RECORDS_PER_REQUEST = 500;
/** Maximum Firestore writeBatch operations */
const FIRESTORE_BATCH_SIZE = 500;

/** Supported entity types for sync */
const ALLOWED_COLLECTIONS = new Set([
  "production_records",
  "mortality_records",
  "chicken_lots",
  "chicken_houses",
  "feed_batches",
  "feeding_records",
  "health_events",
  "biosecurity_events",
]);

interface SyncRecord {
  entityType: string;
  entityId: string;
  operation: "create" | "update" | "delete";
  data?: Record<string, unknown>;
  timestamp: string;
}

interface BatchSyncRequest {
  userId: string;
  deviceId: string;
  records: SyncRecord[];
}

interface BatchSyncResult {
  processed: number;
  errors: string[];
}

/**
 * Validate that the user is authorized (authenticated and not revoked)
 */
async function validateUserAccess(
  userId: string,
  deviceId: string
): Promise<{valid: true} | {valid: false; error: string; statusCode: number}> {
  const userDoc = await admin.firestore().collection("users").doc(userId).get();

  if (!userDoc.exists) {
    return {valid: false, error: "Usuario no encontrado", statusCode: 404};
  }

  const user = userDoc.data()!;

  if (user.authStatus === "revoked") {
    return {
      valid: false,
      error: "Acceso denegado: usuario revocado",
      statusCode: 403,
    };
  }

  if (user.authStatus !== "authenticated") {
    return {
      valid: false,
      error: "Usuario no autenticado",
      statusCode: 401,
    };
  }

  // Verify device is authorized
  const authorizedDevices: Array<{deviceId: string}> =
    Array.isArray(user.authorizedDevices) ? user.authorizedDevices : [];

  const deviceAuthorized = authorizedDevices.some(
    (d) => d.deviceId === deviceId
  );

  if (!deviceAuthorized) {
    return {
      valid: false,
      error: "Dispositivo no autorizado",
      statusCode: 403,
    };
  }

  return {valid: true};
}

/**
 * Process a batch of sync records using Firestore batch writes
 */
async function processBatch(
  records: SyncRecord[],
  userId: string
): Promise<{processed: number; errors: string[]}> {
  const db = admin.firestore();
  const errors: string[] = [];
  let processed = 0;

  // Split into chunks of FIRESTORE_BATCH_SIZE
  for (let i = 0; i < records.length; i += FIRESTORE_BATCH_SIZE) {
    const chunk = records.slice(i, i + FIRESTORE_BATCH_SIZE);
    const batch = db.batch();
    const chunkErrors: string[] = [];

    for (const record of chunk) {
      // Validate collection
      if (!ALLOWED_COLLECTIONS.has(record.entityType)) {
        chunkErrors.push(`Unknown entity type: ${record.entityType}`);
        continue;
      }

      if (!record.entityId) {
        chunkErrors.push(`Missing entityId for ${record.entityType}`);
        continue;
      }

      const docRef = db.collection(record.entityType).doc(record.entityId);

      try {
        if (record.operation === "delete") {
          batch.delete(docRef);
        } else {
          // create or update
          const dataWithMeta = {
            ...(record.data ?? {}),
            id: record.entityId,
            last_synced_by: userId,
            server_updated_at: admin.firestore.FieldValue.serverTimestamp(),
          };

          if (record.operation === "create") {
            batch.set(docRef, dataWithMeta, {merge: true});
          } else {
            batch.set(docRef, dataWithMeta, {merge: true});
          }
        }
      } catch (err: any) {
        chunkErrors.push(
          `Error preparing ${record.entityType}/${record.entityId}: ${err.message}`
        );
      }
    }

    // Commit the chunk batch
    try {
      await batch.commit();
      processed += chunk.length - chunkErrors.length;
    } catch (err: any) {
      chunkErrors.push(`Batch commit error: ${err.message}`);
    }

    errors.push(...chunkErrors);
  }

  return {processed, errors};
}

/**
 * batchSync HTTP function
 */
export const batchSync = functions.onRequest(async (req, res) => {
  // Handle CORS and validate method
  if (!handleCorsAndMethod(req, res, "POST")) return;

  // Parse request body
  const bodyResult = parseBody<BatchSyncRequest>(req.body);
  if (!bodyResult.success) {
    return sendError(res, bodyResult);
  }

  const {userId, deviceId, records} = bodyResult.data;

  // Validate required fields
  if (!userId || !deviceId) {
    return sendError(
      res,
      fail("Se requieren userId y deviceId", 400)
    );
  }

  if (!Array.isArray(records) || records.length === 0) {
    return sendError(res, fail("Se requiere al menos un registro", 400));
  }

  if (records.length > MAX_RECORDS_PER_REQUEST) {
    return sendError(
      res,
      fail(`Máximo ${MAX_RECORDS_PER_REQUEST} registros por solicitud`, 400)
    );
  }

  // Validate user access
  const accessResult = await validateUserAccess(userId, deviceId);
  if (!accessResult.valid) {
    return sendError(
      res,
      fail(accessResult.error, accessResult.statusCode)
    );
  }

  // Process batch
  const result: BatchSyncResult = await processBatch(records, userId);

  console.log(
    `batchSync: user=${userId} device=${deviceId} ` +
      `processed=${result.processed} errors=${result.errors.length}`
  );

  return sendSuccess(res, result);
});
