/**
 * Audit Logging Helper (T112)
 *
 * Centralized helper for writing audit log entries to Firestore.
 * Used across Cloud Functions for critical operations.
 *
 * Critical operations tracked:
 * - User creation
 * - Invitation generation / acceptance
 * - User revocation
 * - Lot creation / deletion
 * - High mortality (>10%) — see onMortalityRecordCreated trigger
 */

import * as admin from "firebase-admin";

export type AuditAction =
  | "user_created"
  | "user_revoked"
  | "invitation_generated"
  | "invitation_accepted"
  | "invitation_regenerated"
  | "lot_created"
  | "lot_deleted"
  | "high_mortality_detected";

export interface AuditEntry {
  action: AuditAction;
  entityType: string;
  entityId: string;
  performedBy: string;
  details?: Record<string, unknown>;
  /** Optional: run inside an existing transaction */
  transaction?: admin.firestore.Transaction;
}

/**
 * Write an audit log entry to Firestore.
 *
 * @param entry - audit entry details
 * @returns the auto-generated document ID
 */
export async function writeAuditLog(entry: AuditEntry): Promise<string> {
  const db = admin.firestore();
  const auditRef = db.collection("audit_log").doc();

  const payload = {
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    performedBy: entry.performedBy,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    details: entry.details ?? {},
  };

  if (entry.transaction) {
    entry.transaction.set(auditRef, payload);
  } else {
    await auditRef.set(payload);
  }

  return auditRef.id;
}

/**
 * Write an audit log entry within a Firestore transaction.
 * Convenience wrapper for writeAuditLog with a transaction.
 */
export function writeAuditLogInTransaction(
  transaction: admin.firestore.Transaction,
  entry: Omit<AuditEntry, "transaction">
): void {
  const db = admin.firestore();
  const auditRef = db.collection("audit_log").doc();

  transaction.set(auditRef, {
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    performedBy: entry.performedBy,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    details: entry.details ?? {},
  });
}
