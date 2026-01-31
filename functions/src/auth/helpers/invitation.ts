/**
 * Invitation Helpers
 *
 * Shared invitation creation logic.
 */

import * as admin from "firebase-admin";
import {randomUUID} from "crypto";

/**
 * Create a new invitation object
 */
export function createInvitationData(userId: string, createdBy: string) {
  const invitationId = randomUUID();
  const token = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return {
    invitationId,
    token,
    expiresAt,
    invitation: {
      id: invitationId,
      userId,
      token,
      createdBy,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      status: "pending",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  };
}
