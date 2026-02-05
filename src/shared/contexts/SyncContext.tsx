/**
 * SyncContext
 *
 * Global synchronization state management.
 * Provides real-time sync status and pending count to all components in the app.
 *
 * IMPORTANT: NO auto-sync, NO polling - all synchronization is manual only.
 *
 * Usage:
 * ```typescript
 * import { useSyncContext } from '@/shared/contexts/SyncContext';
 *
 * function MyComponent() {
 *   const { status, pendingCount, sync, isOnline } = useSyncContext();
 *
 *   return (
 *     <View>
 *       <Text>Status: {status}</Text>
 *       <Text>Pending: {pendingCount}</Text>
 *       <Button onPress={sync} disabled={!isOnline || status === 'syncing'}>
 *         Sync Now
 *       </Button>
 *     </View>
 *   );
 * }
 * ```
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNetInfo } from '@/shared/hooks/useNetInfo';
import { SyncService } from '@/shared/sync/SyncService';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { ConflictResolver } from '@/shared/sync/ConflictResolver';
import { getDatabase } from '@/shared/database';
import { firestore } from '@/core/config/firebase';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'failed';

interface SyncContextValue {
  status: SyncStatus;
  pendingCount: number;
  lastSyncAt: Date | null;
  error: Error | null;
  isOnline: boolean;
  sync: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, isInternetReachable } = useNetInfo();
  const [status, setStatus] = useState<SyncStatus>('pending');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Services
  const syncServiceRef = useRef<SyncService | null>(null);
  const syncQueueRef = useRef<SyncQueue | null>(null);
  const isSyncingRef = useRef(false);

  // Initialize services once
  useEffect(() => {
    const db = getDatabase();
    const syncQueue = new SyncQueue(db);
    const conflictResolver = new ConflictResolver();
    const syncService = new SyncService(db, firestore, syncQueue, conflictResolver);

    syncServiceRef.current = syncService;
    syncQueueRef.current = syncQueue;

    // Load initial pending count
    syncQueue.getPendingCount().then(setPendingCount);
  }, []);

  // Refresh pending count manually
  const refreshPendingCount = useCallback(async () => {
    if (syncQueueRef.current && !isSyncingRef.current) {
      try {
        const count = await syncQueueRef.current.getPendingCount();
        setPendingCount(count);

        // Update status based on pending count
        if (count > 0 && status === 'synced') {
          setStatus('pending');
        } else if (count === 0 && status === 'pending' && !error) {
          setStatus('synced');
        }
      } catch (err) {
        console.error('[SyncContext] Error refreshing pending count:', err);
      }
    }
  }, [status, error]);

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
      await refreshPendingCount();
    } catch (err) {
      setStatus('failed');
      setError(err as Error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isConnected, isInternetReachable, refreshPendingCount]);

  // NOTE: NO auto-sync on connectivity restoration
  // NOTE: NO automatic polling interval
  // All sync operations are manual only to prevent database lock conflicts

  return (
    <SyncContext.Provider
      value={{
        status,
        pendingCount,
        lastSyncAt,
        error,
        isOnline: Boolean(isConnected && isInternetReachable),
        sync,
        refreshPendingCount,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
}
