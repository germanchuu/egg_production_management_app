/**
 * Accept Invitation Cloud Function (T043)
 *
 * Marks invitation as accepted and authenticates the user.
 * Adds device to user's authorized devices list.
 *
 * Prevents acceptance if user is revoked.
 */

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import {validateInvitationToken} from "./helpers/validation";

interface AcceptInvitationRequest {
  token: string;
  deviceId: string;
  deviceName: string;
}

interface AcceptInvitationResponse {
  success: boolean;
  userId?: string;
  error?: string;
}

export const acceptInvitation = functions.https.onCall<
  AcceptInvitationRequest,
  Promise<AcceptInvitationResponse>
>(async (request) => {
  const {data} = request;

  try {
    const {token, deviceId, deviceName} = data;

    if (!token || !deviceId || !deviceName) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Token, deviceId y deviceName son requeridos"
      );
    }

    // Use shared validation helper
    const {invitationDoc, userDoc, user} =
      await validateInvitationToken(token);

    // Use transaction to ensure atomicity
    await admin.firestore().runTransaction(async (transaction) => {
      // Add device to authorized devices (max 3)
      const authorizedDevices = user.authorizedDevices || [];

      // Check if device already exists
      const deviceExists = authorizedDevices.some(
        (d: any) => d.deviceId === deviceId
      );

      if (!deviceExists) {
        if (authorizedDevices.length >= 3) {
          throw new functions.https.HttpsError(
            "resource-exhausted",
            "Máximo 3 dispositivos autorizados por usuario"
          );
        }

        authorizedDevices.push({
          deviceId,
          deviceName,
          authorizedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Update user status to authenticated
      transaction.update(userDoc.ref, {
        authStatus: "authenticated",
        authorizedDevices,
        lastAccessAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Mark invitation as accepted
      transaction.update(invitationDoc.ref, {
        status: "accepted",
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return {
      success: true,
      userId: userDoc.id,
    };
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    console.error("Error accepting invitation:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error al aceptar la invitación"
    );
  }
});
