/**
 * Admin Validator
 *
 * Validates admin user credentials and device authorization
 */

import * as admin from "firebase-admin";
import {Result, ok, fail} from "../../common/types/result";

export interface AdminData {
  adminUser: FirebaseFirestore.DocumentData;
  adminDoc: FirebaseFirestore.DocumentSnapshot;
}

/**
 * Validates that a user is an admin with an authorized device
 *
 * Checks:
 * 1. Admin user exists
 * 2. User has admin role
 * 3. Admin is not revoked
 * 4. Device is in authorized devices list
 */
export async function validateAdmin(
  adminUserId: string,
  adminDeviceId: string
): Promise<Result<AdminData>> {
  // Check admin user exists
  const adminDoc = await admin
    .firestore()
    .collection("users")
    .doc(adminUserId)
    .get();

  if (!adminDoc.exists) {
    return fail("Usuario administrador no encontrado", 404);
  }

  const adminUser = adminDoc.data();

  // Verify admin role
  if (adminUser?.role !== "admin") {
    return fail("Acceso denegado. Se requiere rol de administrador", 403);
  }

  // Verify admin is not revoked
  if (adminUser?.authStatus === "revoked") {
    return fail("Acceso denegado. Usuario revocado", 403);
  }

  // Verify device is authorized
  const authorizedDevices = Array.isArray(adminUser?.authorizedDevices)
    ? adminUser.authorizedDevices
    : [];

  const deviceAuthorized = authorizedDevices.some(
    (device: any) => device.deviceId === adminDeviceId
  );

  if (!deviceAuthorized) {
    return fail("Dispositivo no autorizado", 403);
  }

  return ok({adminUser, adminDoc});
}
