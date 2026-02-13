/**
 * Users Collection Firestore Listener
 *
 * Real-time listener for the users collection that syncs changes to local SQLite.
 * Handles added, modified, and removed documents.
 *
 * Usage:
 * ```typescript
 * import { startUsersListener, stopUsersListener } from '@/shared/sync/listeners/usersListener';
 *
 * // Start listening
 * startUsersListener();
 *
 * // Stop listening (cleanup)
 * stopUsersListener();
 * ```
 */

import { collection, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { firestore } from '@/core/config/firebase';
import { getDatabase } from '@/shared/database';

let unsubscribe: Unsubscribe | null = null;

/**
 * Starts the real-time listener for the users collection
 *
 * Automatically syncs all changes (add/modify/remove) to local SQLite
 */
export function startUsersListener(): void {
  if (unsubscribe) {
    console.warn('[UsersListener] Already listening, skipping duplicate subscription');
    return;
  }

  const db = getDatabase();
  const usersRef = collection(firestore, 'users');

  console.log('[UsersListener] Starting real-time listener...');

  unsubscribe = onSnapshot(
    usersRef,
    (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const doc = change.doc;
        const data = doc.data();

        try {
          if (change.type === 'added' || change.type === 'modified') {
            // Insert or update user in local database
            await db.runAsync(
              `INSERT OR REPLACE INTO users
               (id, display_name, role, auth_status, authorized_devices,
                is_active, invitation_id, last_access_at, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                doc.id,
                data.displayName,
                data.role,
                data.authStatus,
                JSON.stringify(data.authorizedDevices || []),
                data.isActive ? 1 : 0,
                data.invitationId ?? null,
                data.lastAccessAt ?? null,
                data.createdAt,
                data.updatedAt,
              ]
            );

            console.log(`[UsersListener] ${change.type}: ${doc.id}`);
          } else if (change.type === 'removed') {
            // Delete user from local database
            await db.runAsync('DELETE FROM users WHERE id = ?', [doc.id]);

            console.log(`[UsersListener] removed: ${doc.id}`);
          }
        } catch (error) {
          console.error(`[UsersListener] Error processing ${change.type}:`, error);
        }
      });
    },
    (error) => {
      console.error('[UsersListener] Snapshot error:', error);
    }
  );

  console.log('[UsersListener] Listener started successfully');
}

/**
 * Stops the users collection listener
 *
 * Should be called on app cleanup or when switching contexts
 */
export function stopUsersListener(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
    console.log('[UsersListener] Listener stopped');
  }
}
