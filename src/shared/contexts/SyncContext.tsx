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
import EventEmitter from 'eventemitter3';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'failed';

interface SyncContextValue {
  status: SyncStatus;
  pendingCount: number;
  lastSyncAt: Date | null;
  error: Error | null;
  isOnline: boolean;
  sync: (useListeners?: boolean) => Promise<void>;
  refreshPendingCount: () => Promise<void>;
  getPendingEntityIds: (entityType: string) => Promise<Set<string>>;
  onSyncCompleted: (callback: () => void) => void;
  offSyncCompleted: (callback: () => void) => void;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

// Global event emitter for sync events
const syncEventEmitter = new EventEmitter();

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

      const db = getDatabase();

      // Auto deep refresh: Check if we need a full sync (every 7 days)
      if (!useListeners) {
        const lastFullSync = await db.getFirstAsync<{ value: string }>(
          `SELECT value FROM sync_metadata WHERE key = 'lastFullSyncAt'`
        );

        const lastFullSyncDate = lastFullSync?.value
          ? new Date(lastFullSync.value)
          : null;

        const daysSinceLastFullSync = lastFullSyncDate
          ? (Date.now() - lastFullSyncDate.getTime()) / (1000 * 60 * 60 * 24)
          : Infinity;

        // If more than 7 days, force full sync to detect deletions
        if (daysSinceLastFullSync > 7) {
          console.log(
            `[SyncContext] Last full sync was ${daysSinceLastFullSync.toFixed(1)} days ago, running deep refresh...`
          );
          useListeners = true;
        }
      }

      console.log('[SyncContext] Starting sync...');

      if (useListeners) {
        // Deep refresh mode: Full sync with deletion detection
        console.log('[SyncContext] Deep refresh: Full sync with deletion detection...');
        await syncWithListeners(true); // detectDeletions = true

        // Upload pending local changes
        const uploaded = await syncServiceRef.current.batchSync();
        console.log('[SyncContext] Uploaded', uploaded, 'pending changes');

        // Save full sync timestamp
        const now = new Date().toISOString();
        await db.runAsync(
          `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES (?, ?, ?)`,
          ['lastFullSyncAt', now, now]
        );

        setStatus('synced');
        setLastSyncAt(new Date());
      } else {
        // Fast refresh mode: Listeners without deletion detection
        // This allows users to see insertions/updates from other users immediately
        // while being much faster than deep refresh
        console.log('[SyncContext] Fast refresh: Syncing inserts/updates (no deletion detection)...');
        await syncWithListeners(false); // detectDeletions = false

        // Upload pending local changes
        const uploaded = await syncServiceRef.current.batchSync();
        console.log('[SyncContext] Uploaded', uploaded, 'pending changes');

        setStatus('synced');
        setLastSyncAt(new Date());
      }

      // IMPORTANT: Wait a bit before querying pending count to avoid lock
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update pending count AFTER sync completes
      if (syncQueueRef.current) {
        const count = await syncQueueRef.current.getPendingCount();
        setPendingCount(count);
      }

      // Emit sync completed event so all screens can refresh their data
      syncEventEmitter.emit('sync-completed');
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

  // Event subscription functions
  const onSyncCompleted = useCallback((callback: () => void) => {
    syncEventEmitter.on('sync-completed', callback);
  }, []);

  const offSyncCompleted = useCallback((callback: () => void) => {
    syncEventEmitter.off('sync-completed', callback);
  }, []);

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
        onSyncCompleted,
        offSyncCompleted,
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

/**
 * Hook to automatically refresh data when sync completes
 *
 * Use this hook in any screen that displays data from the database
 * to ensure it refreshes automatically after a sync (from any screen).
 *
 * @param callback Function to call when sync completes (usually your loadData function)
 *
 * @example
 * ```typescript
 * const loadData = useCallback(async () => {
 *   // Load data from database
 * }, []);
 *
 * useSyncRefresh(loadData); // Auto-refresh when sync completes
 * ```
 */
export function useSyncRefresh(callback: () => void) {
  const { onSyncCompleted, offSyncCompleted } = useSyncContext();
  const callbackRef = useRef(callback);

  // Update ref when callback changes (without re-subscribing)
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Subscribe once on mount
  useEffect(() => {
    const handler = () => {
      callbackRef.current();
    };

    onSyncCompleted(handler);

    // Cleanup: unsubscribe on unmount
    return () => {
      offSyncCompleted(handler);
    };
  }, [onSyncCompleted, offSyncCompleted]);
}
