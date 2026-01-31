/**
 * Auth Helpers
 *
 * Shared validation logic for authentication functions.
 */

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

export interface InvitationValidationResult {
  invitationDoc: FirebaseFirestore.QueryDocumentSnapshot;
  invitation: any;
  userDoc: FirebaseFirestore.DocumentSnapshot;
  user: any;
}

/**
 * Validate invitation token and return invitation + user data
 * Throws HttpsError if validation fails
 */
export async function validateInvitationToken(
  token: string
): Promise<InvitationValidationResult> {
  // Find invitation by token
  const invitationsSnapshot = await admin
    .firestore()
    .collection("invitations")
    .where("token", "==", token)
    .limit(1)
    .get();

  if (invitationsSnapshot.empty) {
    throw new functions.https.HttpsError(
      "not-found",
      "Invitación no encontrada"
    );
  }

  const invitationDoc = invitationsSnapshot.docs[0];
  const invitation = invitationDoc.data();

  // Check if already accepted
  if (invitation.status === "accepted") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Esta invitación ya ha sido aceptada"
    );
  }

  // Check if expired
  const now = new Date();
  const expiresAt = invitation.expiresAt.toDate();

  if (now >= expiresAt) {
    // Update status to expired
    await invitationDoc.ref.update({
      status: "expired",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    throw new functions.https.HttpsError(
      "failed-precondition",
      "Esta invitación ha expirado"
    );
  }

  // Get user data
  const userDoc = await admin
    .firestore()
    .collection("users")
    .doc(invitation.userId)
    .get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Usuario no encontrado"
    );
  }

  const user = userDoc.data();

  // Check if user is revoked
  if (user?.authStatus === "revoked") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Este usuario ha sido revocado"
    );
  }

  // Check if user can accept invitation (must be pending)
  if (user?.authStatus !== "pending") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Este usuario ya está autenticado"
    );
  }

  return {
    invitationDoc,
    invitation,
    userDoc,
    user,
  };
}
