/**
 * User Service
 *
 * Business logic for user operations
 */

import * as admin from "firebase-admin";
import {Result, ok, fail} from "../../common/types/result";

export interface RevokeUserResult {
  success: true;
}

/**
 * Revoke a user's access
 */
export async function revokeUser(
  userId: string,
  adminUserId: string,
  reason?: string
): Promise<Result<RevokeUserResult>> {
  try {
    // Cannot revoke yourself
    if (userId === adminUserId) {
      return fail("No puedes revocar tu propio acceso", 400);
    }

    // Get target user
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return fail("Usuario no encontrado", 404);
    }

    const targetUser = userDoc.data();

    // Prevent revoking other admins
    if (targetUser?.role === "admin") {
      return fail("No puedes revocar el acceso de otro administrador", 403);
    }

    // Check if already revoked
    if (targetUser?.authStatus === "revoked") {
      return fail("Este usuario ya está revocado", 400);
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
        performedBy: adminUserId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
          userId,
          revokedBy: adminUserId,
          reason: reason || "No reason provided",
          previousStatus: targetUser!.authStatus,
        },
      });
    });

    return ok({success: true});
  } catch (error: any) {
    console.error("Error in revokeUser service:", error);
    return fail("Error al revocar el usuario", 500);
  }
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(
  token: string,
  deviceId: string,
  deviceName: string
): Promise<Result<{userId: string}>> {
  try {
    const {validateInvitationToken} = await import("../helpers/validation");

    // Use shared validation helper
    const {invitationDoc, userDoc, user} =
      await validateInvitationToken(token);

    // Use transaction to ensure atomicity
    await admin.firestore().runTransaction(async (transaction) => {
      // Add device to authorized devices (max 3)
      const authorizedDevices = Array.isArray(user.authorizedDevices)
        ? user.authorizedDevices
        : [];

      // Check if device already exists
      const deviceExists = authorizedDevices.some(
        (d: any) => d.deviceId === deviceId
      );

      if (!deviceExists) {
        if (authorizedDevices.length >= 3) {
          throw new Error("Máximo 3 dispositivos autorizados por usuario");
        }

        authorizedDevices.push({
          deviceId,
          deviceName,
          authorizedAt: admin.firestore.Timestamp.now(),
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

    return ok({userId: userDoc.id});
  } catch (error: any) {
    console.error("Error in acceptInvitation service:", error);

    // Handle specific errors
    if (error.message?.includes("Máximo 3 dispositivos")) {
      return fail(error.message, 429);
    }

    // Handle validation errors
    if (error.message?.includes("no encontrada") ||
        error.message?.includes("expirada") ||
        error.message?.includes("revocado")) {
      return fail(error.message, 400);
    }

    return fail("Error al aceptar la invitación", 500);
  }
}

/**
 * Validate an invitation token
 */
export async function validateInvitation(
  token: string
): Promise<Result<{
  invitation: any;
  user: any;
}>> {
  try {
    const {validateInvitationToken} = await import("../helpers/validation");

    // Use shared validation helper
    const {invitationDoc, invitation, userDoc, user} =
      await validateInvitationToken(token);

    const expiresAt = invitation.expiresAt.toDate();

    return ok({
      invitation: {
        id: invitationDoc.id,
        userId: invitation.userId,
        expiresAt: expiresAt.toISOString(),
        status: invitation.status,
      },
      user: {
        id: userDoc.id,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Error in validateInvitation service:", error);
    return fail(error.message || "Error al validar la invitación", 400);
  }
}
