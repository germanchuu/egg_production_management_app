/**
 * Revoke User Cloud Function (T044a)
 *
 * Admin-only function to permanently revoke user access.
 * Sets authStatus='revoked', clears authorizedDevices, creates audit log.
 *
 * Prevents revocation of self and other admins.
 * Revocation is PERMANENT and cannot be reversed.
 */

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import {verifyAdmin} from "./helpers";

interface RevokeUserRequest {
  userId: string;
  reason?: string;
}

interface RevokeUserResponse {
  success: boolean;
  error?: string;
}

export const revokeUser = functions.https.onCall<
  RevokeUserRequest,
  Promise<RevokeUserResponse>
>(async (request) => {
  const {data, auth} = request;

  // Verify admin
  await verifyAdmin(auth);

  try {
    const {userId, reason} = data;

    if (!userId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "userId es requerido"
      );
    }

    // Cannot revoke yourself
    if (userId === auth!.uid) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "No puedes revocar tu propio acceso"
      );
    }

    // Get target user
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

    const targetUser = userDoc.data();

    // Prevent revoking other admins
    if (targetUser?.role === "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "No puedes revocar el acceso de otro administrador"
      );
    }

    // Check if already revoked
    if (targetUser?.authStatus === "revoked") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Este usuario ya está revocado"
      );
    }

    // Use transaction for atomicity
    await admin.firestore().runTransaction(async (transaction) => {
      // Revoke user
      transaction.update(userDoc.ref, {
        authStatus: "revoked",
        authorizedDevices: [], // Clear all authorized devices
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create audit log
      const auditLogRef = admin
        .firestore()
        .collection("audit_log")
        .doc();

      transaction.set(auditLogRef, {
        action: "user_revoked",
        entityType: "user",
        entityId: userId,
        performedBy: auth!.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
          userId,
          revokedBy: auth!.uid,
          reason: reason || "No reason provided",
          previousStatus: targetUser!.authStatus,
        },
      });
    });

    return {
      success: true,
    };
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    console.error("Error revoking user:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error al revocar el usuario"
    );
  }
});
