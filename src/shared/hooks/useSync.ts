/**
 * useSync Hook
 *
 * React hook for managing automatic synchronization with Firebase.
 *
 * Features:
 * - Automatic sync trigger on network connectivity restoration
 * - Manual sync trigger
 * - Real-time sync status (synced/pending/syncing/failed)
 * - Pending changes count
 * - Last sync timestamp
 *
 * Usage:
 * ```typescript
 * import { useSync } from '@/shared/hooks/useSync';
 *
 * function MyComponent() {
 *   const { status, pendingCount, sync, lastSyncAt } = useSync();
 *
 *   return (
 *     <View>
 *       <Text>Status: {status}</Text>
 *       <Text>Pending: {pendingCount}</Text>
 *       <Button onPress={sync} title="Sync Now" />
 *     </View>
 *   );
 * }
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNetInfo } from '@/shared/hooks/useNetInfo';
import { SyncService } from '@/shared/sync/SyncService';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { ConflictResolver } from '@/shared/sync/ConflictResolver';
import { getDatabase } from '@/shared/database';
import { getFirestore } from '@/core/config/firebase';

/**
 * Sync status types
 */
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'failed';

/**
 * Sync hook state
 */
export interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncAt: Date | null;
  error: Error | null;
}

/**
 * Sync hook return value
 */
export interface UseSyncReturn extends SyncState {
  sync: () => Promise<void>;
  isOnline: boolean;
}

/**
 * Hook for managing automatic synchronization
 *
 * Automatically syncs when:
 * - Network connectivity is restored
 * - App comes to foreground (optional, requires AppState listener)
 * - Manual sync is triggered
 *
 * @returns Sync state and manual sync function
 */
export function useSync(): UseSyncReturn {
  const { isConnected, isInternetReachable } = useNetInfo();
  const [status, setStatus] = useState<SyncStatus>('pending');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Services
  const syncServiceRef = useRef<SyncService | null>(null);
  const syncQueueRef = useRef<SyncQueue | null>(null);

  // Track if we're currently syncing to prevent duplicate syncs
  const isSyncingRef = useRef(false);

  // Initialize services
  useEffect(() => {
    const db = getDatabase();
    const firestore = getFirestore();
    const syncQueue = new SyncQueue(db);
    const conflictResolver = new ConflictResolver();
    const syncService = new SyncService(db, firestore, syncQueue, conflictResolver);

    syncServiceRef.current = syncService;
    syncQueueRef.current = syncQueue;

    // Update pending count on mount
    syncQueue.getPendingCount().then(setPendingCount);
  }, []);

  // Manual sync function
  const sync = useCallback(async () => {
    if (!syncServiceRef.current || isSyncingRef.current) {
      return;
    }

    // Check if online
    if (!isConnected || !isInternetReachable) {
      setStatus('pending');
      return;
    }

    try {
      isSyncingRef.current = true;
      setStatus('syncing');
      setError(null);

      const result = await syncServiceRef.current.sync();

      // Update state based on result
      if (result.errors.length > 0) {
        setStatus('failed');
        setError(new Error(result.errors.join(', ')));
      } else {
        setStatus('synced');
        setLastSyncAt(new Date());
      }

      // Update pending count
      if (syncQueueRef.current) {
        const count = await syncQueueRef.current.getPendingCount();
        setPendingCount(count);

        // If there are still pending items, status should be pending
        if (count > 0) {
          setStatus('pending');
        }
      }
    } catch (err) {
      setStatus('failed');
      setError(err as Error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isConnected, isInternetReachable]);

  // Auto-sync on connectivity restoration
  useEffect(() => {
    if (isConnected && isInternetReachable && !isSyncingRef.current) {
      // Trigger sync when connectivity is restored
      sync();
    }
  }, [isConnected, isInternetReachable, sync]);

  // Periodic pending count check (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (syncQueueRef.current && !isSyncingRef.current) {
        const count = await syncQueueRef.current.getPendingCount();
        setPendingCount(count);

        // Update status based on pending count
        if (count > 0 && status === 'synced') {
          setStatus('pending');
        } else if (count === 0 && status === 'pending' && !error) {
          setStatus('synced');
        }
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [status, error]);

  return {
    status,
    pendingCount,
    lastSyncAt,
    error,
    sync,
    isOnline: Boolean(isConnected && isInternetReachable),
  };
}
