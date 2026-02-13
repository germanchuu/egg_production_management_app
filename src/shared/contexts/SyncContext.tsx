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
import { syncWithListeners } from '@/shared/sync/listeners/syncWithListeners';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'failed';

interface SyncContextValue {
  status: SyncStatus;
  pendingCount: number;
  lastSyncAt: Date | null;
  error: Error | null;
  isOnline: boolean;
  sync: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
  getPendingEntityIds: (entityType: string) => Promise<Set<string>>;
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

  // Initialize services once (lazy initialization)
  const initializeServices = useCallback(() => {
    if (!syncServiceRef.current || !syncQueueRef.current) {
      const db = getDatabase();
      const syncQueue = new SyncQueue(db);
      const conflictResolver = new ConflictResolver();
      const syncService = new SyncService(db, firestore, syncQueue, conflictResolver);

      syncServiceRef.current = syncService;
      syncQueueRef.current = syncQueue;
    }
  }, []);

  // Get all pending entity IDs for a type (batch query - efficient)
  const getPendingEntityIds = useCallback(async (entityType: string): Promise<Set<string>> => {
    initializeServices();

    if (!syncQueueRef.current) {
      return new Set();
    }

    try {
      return await syncQueueRef.current.getPendingEntityIds(entityType);
    } catch (err) {
      console.error('[SyncContext] Error getting pending entity IDs:', err);
      return new Set();
    }
  }, [initializeServices]);

  // Refresh pending count manually
  const refreshPendingCount = useCallback(async () => {
    // IMPORTANT: Don't query while syncing to prevent database locks
    if (isSyncingRef.current) {
      return;
    }

    initializeServices();

    if (syncQueueRef.current) {
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
  }, [status, error, initializeServices]);

  // Manual sync function with optional listener-based download
  const sync = useCallback(async (useListeners = false) => {
    // Prevent concurrent syncs
    if (isSyncingRef.current) {
      console.log('[SyncContext] Sync already in progress, skipping');
      return;
    }

    // Initialize services if needed
    initializeServices();

    if (!syncServiceRef.current) {
      console.error('[SyncContext] Sync service not initialized');
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

      console.log('[SyncContext] Starting sync...');

      if (useListeners) {
        // Use one-shot listeners for full sync (includes deletions)
        console.log('[SyncContext] Using one-shot listeners for full sync...');
        await syncWithListeners();

        // Upload pending local changes
        const uploaded = await syncServiceRef.current.batchSync();
        console.log('[SyncContext] Uploaded', uploaded, 'pending changes');

        setStatus('synced');
        setLastSyncAt(new Date());
      } else {
        // Use regular incremental sync
        const result = await syncServiceRef.current.sync();
        console.log('[SyncContext] Sync completed:', result);

        // Update state based on result
        if (result.errors.length > 0) {
          setStatus('failed');
          setError(new Error(result.errors.join(', ')));
        } else {
          setStatus('synced');
          setLastSyncAt(new Date());
        }
      }

      // IMPORTANT: Wait a bit before querying pending count to avoid lock
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update pending count AFTER sync completes
      if (syncQueueRef.current) {
        const count = await syncQueueRef.current.getPendingCount();
        setPendingCount(count);
      }
    } catch (err) {
      console.error('[SyncContext] Sync error:', err);
      setStatus('failed');
      setError(err as Error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isConnected, isInternetReachable, initializeServices]);

  // T102: Auto-sync on connectivity restoration
  useEffect(() => {
    if (isConnected && isInternetReachable && !isSyncingRef.current) {
      // Trigger sync when connectivity is restored
      // Small delay to ensure network is stable
      const timeoutId = setTimeout(() => {
        sync();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, isInternetReachable, sync]);

  // Listen to sync queue changes for real-time UI updates
  useEffect(() => {
    initializeServices();

    if (!syncQueueRef.current) {
      return;
    }

    const handleQueueChanged = () => {
      refreshPendingCount();
    };

    // Subscribe to queue changes
    syncQueueRef.current.on('changed', handleQueueChanged);

    // Initial count on mount
    refreshPendingCount();

    // Cleanup: remove listener on unmount
    return () => {
      if (syncQueueRef.current) {
        syncQueueRef.current.off('changed', handleQueueChanged);
      }
    };
  }, [initializeServices, refreshPendingCount]);

  // One-shot sync with listeners on app open (only once)
  useEffect(() => {
    // Small delay to ensure database is ready
    const timeoutId = setTimeout(() => {
      if (isConnected && isInternetReachable) {
        console.log('[SyncContext] App opened, running initial sync with listeners...');
        sync(true); // Use listeners for initial sync
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = run only once on mount

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
        getPendingEntityIds,
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
