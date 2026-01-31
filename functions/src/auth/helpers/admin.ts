/**
 * Admin Helpers
 *
 * Shared admin verification logic.
 * NO USES Firebase Authentication - validates using Firestore only.
 */

/**
 * Check if a user is revoked
 * Throws Error if user is revoked
 */
export function checkUserNotRevoked(user: any, action: string): void {
  if (user?.authStatus === "revoked") {
    throw new Error(`No se puede ${action} para usuario revocado`);
  }
}
