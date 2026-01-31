/**
 * Admin Helpers
 *
 * Shared admin verification logic.
 */

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

/**
 * Verify that the caller is an authenticated admin
 * Throws HttpsError if not admin
 */
export async function verifyAdmin(auth: functions.https.CallableRequest["auth"]): Promise<void> {
  if (!auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Usuario no autenticado"
    );
  }

  const callerDoc = await admin
    .firestore()
    .collection("users")
    .doc(auth.uid)
    .get();

  if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Solo administradores pueden realizar esta acción"
    );
  }
}

/**
 * Check if a user is revoked
 * Throws HttpsError if user is revoked
 */
export function checkUserNotRevoked(user: any, action: string): void {
  if (user?.authStatus === "revoked") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      `No se puede ${action} para usuario revocado`
    );
  }
}
