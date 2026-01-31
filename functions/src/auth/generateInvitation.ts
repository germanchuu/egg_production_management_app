/**
 * Generate Invitation Cloud Function (T041)
 *
 * Admin-only function to generate a new invitation for a user.
 * Creates an invitation token (deep link generated in frontend).
 *
 * Prevents invitations for revoked users.
 */

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import {verifyAdmin, checkUserNotRevoked, createInvitationData} from "./helpers";

interface GenerateInvitationRequest {
  userId: string;
}

interface GenerateInvitationResponse {
  success: boolean;
  invitationId?: string;
  token?: string;
  expiresAt?: string;
  error?: string;
}

export const generateInvitation = functions.https.onCall<
  GenerateInvitationRequest,
  Promise<GenerateInvitationResponse>
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

    // Prevent invitations for revoked users
    checkUserNotRevoked(user, "generar invitación");

    // Create invitation data using helper
    const {invitationId, token, expiresAt, invitation} =
      createInvitationData(userId, auth!.uid);

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
      .doc(userId)
      .update({
        invitationId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Return token only - deep link will be generated in frontend
    // using InvitationFactory.generateDeepLink(token) from app.json scheme
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

    console.error("Error generating invitation:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error al generar la invitación"
    );
  }
});
