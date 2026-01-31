/**
 * Regenerate Invitation Cloud Function (T044)
 *
 * Admin-only function to regenerate an invitation for a user.
 * Creates a new invitation token (invalidates previous one).
 *
 * Only allows regeneration for pending users (not yet authenticated).
 * Prevents regeneration for revoked users.
 */

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import {verifyAdmin, checkUserNotRevoked, createInvitationData} from "./helpers";

interface RegenerateInvitationRequest {
  userId: string;
}

interface RegenerateInvitationResponse {
  success: boolean;
  invitationId?: string;
  token?: string;
  expiresAt?: string;
  error?: string;
}

export const regenerateInvitation = functions.https.onCall<
  RegenerateInvitationRequest,
  Promise<RegenerateInvitationResponse>
>(async (request) => {
  const {data, auth} = request;

  // Verify admin
  await verifyAdmin(auth);

  try {
    const {userId} = data;

    if (!userId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "userId es requerido"
      );
    }

    // Check if user exists
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Usuario no encontrado"
      );
    }

    const user = userDoc.data();

    // Prevent regeneration for revoked users
    checkUserNotRevoked(user, "regenerar invitación");

    // Only allow regeneration for pending users
    // (Users who are already authenticated don't need a new invitation)
    if (user?.authStatus !== "pending") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Solo se puede regenerar invitación para usuarios que aún no han aceptado (estado: pendiente)"
      );
    }

    // Create new invitation data using helper
    const {invitationId, token, expiresAt, invitation} =
      createInvitationData(userId, auth!.uid);

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

    return {
      success: true,
      invitationId,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    console.error("Error regenerating invitation:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error al regenerar la invitación"
    );
  }
});
