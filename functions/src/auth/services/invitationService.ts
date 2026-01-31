/**
 * Invitation Service
 *
 * Business logic for invitation operations
 */

import * as admin from "firebase-admin";
import {Result, ok, fail} from "../../common/types/result";
import {checkUserNotRevoked, createInvitationData} from "../helpers";

export interface InvitationResult {
  invitationId: string;
  token: string;
  expiresAt: string;
}

/**
 * Generate a new invitation for a user
 */
export async function generateInvitation(
  targetUserId: string,
  adminUserId: string
): Promise<Result<InvitationResult>> {
  try {
    // Check if target user exists
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(targetUserId)
      .get();

    if (!userDoc.exists) {
      return fail("Usuario objetivo no encontrado", 404);
    }

    const targetUser = userDoc.data();

    // Prevent invitations for revoked users
    try {
      checkUserNotRevoked(targetUser, "generar invitación");
    } catch (error: any) {
      return fail(error.message, 403);
    }

    // Create invitation data
    const {invitationId, token, expiresAt, invitation} =
      createInvitationData(targetUserId, adminUserId);

    // Save invitation
    await admin
      .firestore()
      .collection("invitations")
      .doc(invitationId)
      .set(invitation);

    // Update user's invitationId
    await admin
      .firestore()
      .collection("users")
      .doc(targetUserId)
      .update({
        invitationId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return ok({
      invitationId,
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Error in generateInvitation service:", error);
    return fail("Error al generar la invitación", 500);
  }
}

/**
 * Regenerate an invitation for a user
 */
export async function regenerateInvitation(
  userId: string,
  adminUserId: string
): Promise<Result<InvitationResult>> {
  try {
    // Check if user exists
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return fail("Usuario no encontrado", 404);
    }

    const user = userDoc.data();

    // Prevent regeneration for revoked users
    try {
      checkUserNotRevoked(user, "regenerar invitación");
    } catch (error: any) {
      return fail(error.message, 403);
    }

    // Only allow regeneration for pending users
    if (user?.authStatus !== "pending") {
      return fail(
        "Solo se puede regenerar invitación para usuarios que aún no han aceptado (estado: pendiente)",
        400
      );
    }

    // Create new invitation data
    const {invitationId, token, expiresAt, invitation} =
      createInvitationData(userId, adminUserId);

    // Use transaction to invalidate old and create new
    await admin.firestore().runTransaction(async (transaction) => {
      // Invalidate old invitation if exists
      if (user.invitationId) {
        const oldInvitationRef = admin
          .firestore()
          .collection("invitations")
          .doc(user.invitationId);

        transaction.update(oldInvitationRef, {
          status: "expired",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Create new invitation
      const newInvitationRef = admin
        .firestore()
        .collection("invitations")
        .doc(invitationId);

      transaction.set(newInvitationRef, invitation);

      // Update user's invitationId
      transaction.update(userDoc.ref, {
        invitationId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return ok({
      invitationId,
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Error in regenerateInvitation service:", error);
    return fail("Error al regenerar la invitación", 500);
  }
}
