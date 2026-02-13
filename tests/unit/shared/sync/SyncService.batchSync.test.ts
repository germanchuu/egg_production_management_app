/**
 * SyncService.batchSync() Tests
 *
 * Tests for batch upload functionality using Firestore writeBatch.
 */

import { SyncService } from '@/shared/sync/SyncService';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { ConflictResolver } from '@/shared/sync/ConflictResolver';
import * as SQLite from 'expo-sqlite';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../../utils/testDatabase';

// Mock Firebase Firestore modular functions
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockGetDocs = jest.fn();

// WriteBatch mock
const mockBatchSet = jest.fn();
const mockBatchDelete = jest.fn();
const mockBatchCommit = jest.fn().mockResolvedValue(undefined);
const mockWriteBatch = jest.fn(() => ({
  set: mockBatchSet,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
}));

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  writeBatch: (...args: any[]) => mockWriteBatch(...args),
}));

const mockFirestore = {} as any;

describe('SyncService.batchSync', () => {
  let db: SQLite.SQLiteDatabase;
  let syncQueue: SyncQueue;
  let conflictResolver: ConflictResolver;
  let syncService: SyncService;

  beforeEach(async () => {
    db = await createTestDatabase();
    syncQueue = new SyncQueue(db);
    conflictResolver = new ConflictResolver();
    syncService = new SyncService(
      db,
      mockFirestore,
      syncQueue,
      conflictResolver
    );

    // Create parent records for foreign key constraints
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO users (id, display_name, role, auth_status, created_at, updated_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['user-1', 'Test User 1', 'admin', 'authenticated', now, now, 1]
    );

    await db.runAsync(
      `INSERT INTO chicken_houses (id, name, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      ['house-1', 'Test House', 'user-1', now, now]
    );

    await db.runAsync(
      `INSERT INTO chicken_lots (id, name, chicken_house_id, purchase_date,
        initial_hen_count, live_hen_count, age_weeks, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'lot-1',
        'Test Lot',
        'house-1',
        '2024-01-01',
        1000,
        1000,
        10,
        'user-1',
        now,
        now,
      ]
    );

    jest.clearAllMocks();

    // Default mock: doc returns a unique ref per call
    let docCallCount = 0;
    mockDoc.mockImplementation((_firestore: any, _col: string, id: string) => {
      return { __docRef: true, id, _index: docCallCount++ };
    });

    mockBatchCommit.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
  });

  it('should return 0 and not create batch when queue is empty', async () => {
    const result = await syncService.batchSync();

    expect(result).toBe(0);
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });

  it('should batch.set() for a single CREATE operation', async () => {
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO production_records
       (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['prod-1', 'lot-1', '2024-01-15', 100, 'user-1', now, now]
    );

    await syncQueue.enqueue({
      entityType: 'production_records',
      entityId: 'prod-1',
      operation: 'CREATE',
    });

    const result = await syncService.batchSync();

    expect(result).toBe(1);
    expect(mockWriteBatch).toHaveBeenCalledWith(mockFirestore);
    expect(mockBatchSet).toHaveBeenCalledTimes(1);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);

    // Verify data passed to batch.set
    const setData = mockBatchSet.mock.calls[0][1];
    expect(setData.id).toBe('prod-1');
    expect(setData.lotId).toBe('lot-1');
    expect(setData.eggsCollected).toBe(100);
  });

  it('should handle mixed operations (CREATE + UPDATE + DELETE) in one batch', async () => {
    const now = new Date().toISOString();

    // CREATE record
    await db.runAsync(
      `INSERT INTO production_records
       (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['prod-1', 'lot-1', '2024-01-15', 100, 'user-1', now, now]
    );
    await syncQueue.enqueue({
      entityType: 'production_records',
      entityId: 'prod-1',
      operation: 'CREATE',
    });

    // UPDATE record
    await db.runAsync(
      `INSERT INTO production_records
       (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['prod-2', 'lot-1', '2024-01-16', 105, 'user-1', now, now]
    );
    await syncQueue.enqueue({
      entityType: 'production_records',
      entityId: 'prod-2',
      operation: 'UPDATE',
    });

    // DELETE record
    await syncQueue.enqueue({
      entityType: 'production_records',
      entityId: 'prod-3',
      operation: 'DELETE',
    });

    const result = await syncService.batchSync();

    expect(result).toBe(3);
    expect(mockBatchSet).toHaveBeenCalledTimes(2); // CREATE + UPDATE
    expect(mockBatchDelete).toHaveBeenCalledTimes(1); // DELETE
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it('should mark all items as synced after commit', async () => {
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO production_records
       (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['prod-1', 'lot-1', '2024-01-15', 100, 'user-1', now, now]
    );
    await db.runAsync(
      `INSERT INTO production_records
       (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['prod-2', 'lot-1', '2024-01-16', 200, 'user-1', now, now]
    );

    await syncQueue.enqueue({
      entityType: 'production_records',
      entityId: 'prod-1',
      operation: 'CREATE',
    });
    await syncQueue.enqueue({
      entityType: 'production_records',
      entityId: 'prod-2',
      operation: 'CREATE',
    });

    const pendingBefore = await syncQueue.getPending();
    expect(pendingBefore).toHaveLength(2);

    await syncService.batchSync();

    const pendingAfter = await syncQueue.getPending();
    expect(pendingAfter).toHaveLength(0);
  });

  it('should process multiple batches when >500 records', async () => {
    const now = new Date().toISOString();

    // Use getPending spy to simulate batch boundaries without creating 500+ real records.
    // Create 3 real records to be returned across 2 "batches"
    for (let i = 0; i < 3; i++) {
      await db.runAsync(
        `INSERT INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`prod-${i}`, 'lot-1', '2024-01-15', i, 'user-1', now, now]
      );
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: `prod-${i}`,
        operation: 'CREATE',
      });
    }

    // Spy on getPending to simulate batch boundaries:
    // First call returns 2 items (simulating a full batch), second returns 1, third returns 0
    const allPending = await syncQueue.getPending();
    const getPendingSpy = jest.spyOn(syncQueue, 'getPending');
    getPendingSpy
      .mockResolvedValueOnce([allPending[0], allPending[1]])  // batch 1
      .mockResolvedValueOnce([allPending[2]])                  // batch 2
      .mockResolvedValueOnce([]);                              // done

    const result = await syncService.batchSync();

    expect(result).toBe(3);
    expect(mockBatchCommit).toHaveBeenCalledTimes(2);

    getPendingSpy.mockRestore();
  });

  it('should skip items that fail preparation and continue with others', async () => {
    const now = new Date().toISOString();

    // Suppress console.warn for this test
    const originalWarn = console.warn;
    const warnCalls: any[][] = [];
    console.warn = (...args: any[]) => { warnCalls.push(args); };

    try {
      // prod-1 exists in DB
      await db.runAsync(
        `INSERT INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['prod-1', 'lot-1', '2024-01-15', 100, 'user-1', now, now]
      );

      // Enqueue CREATE for existing record
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-1',
        operation: 'CREATE',
      });

      // Enqueue CREATE for non-existing record (will be skipped — entity not in local DB)
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-nonexistent',
        operation: 'CREATE',
      });

      // Enqueue DELETE (no local data needed)
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-del',
        operation: 'DELETE',
      });

      const result = await syncService.batchSync();

      // prod-1 (set) + prod-del (delete) = 2 items committed
      expect(result).toBe(2);
      expect(mockBatchSet).toHaveBeenCalledTimes(1);
      expect(mockBatchDelete).toHaveBeenCalledTimes(1);
      expect(warnCalls.length).toBeGreaterThan(0);
    } finally {
      console.warn = originalWarn;
    }
  });

  it('should not mark any items as synced when commit fails', async () => {
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO production_records
       (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['prod-1', 'lot-1', '2024-01-15', 100, 'user-1', now, now]
    );

    await syncQueue.enqueue({
      entityType: 'production_records',
      entityId: 'prod-1',
      operation: 'CREATE',
    });

    mockBatchCommit.mockRejectedValueOnce(new Error('Network error'));

    await expect(syncService.batchSync()).rejects.toThrow('Network error');

    // Items should remain pending
    const pending = await syncQueue.getPending();
    expect(pending).toHaveLength(1);
  });

  it('should keep first batch synced when second batch fails', async () => {
    const now = new Date().toISOString();

    // Create 3 records to simulate 2 batches
    for (let i = 0; i < 3; i++) {
      await db.runAsync(
        `INSERT INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`prod-${i}`, 'lot-1', '2024-01-15', i, 'user-1', now, now]
      );
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: `prod-${i}`,
        operation: 'CREATE',
      });
    }

    // Spy on getPending to simulate batch boundaries
    const allPending = await syncQueue.getPending();
    const getPendingSpy = jest.spyOn(syncQueue, 'getPending');
    getPendingSpy
      .mockResolvedValueOnce([allPending[0], allPending[1]])  // batch 1
      .mockResolvedValueOnce([allPending[2]]);                 // batch 2

    // First commit succeeds, second fails
    mockBatchCommit
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Network error'));

    await expect(syncService.batchSync()).rejects.toThrow('Network error');

    getPendingSpy.mockRestore();

    // First 2 should be synced, remaining 1 should be pending
    const pending = await syncQueue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].entity_id).toBe('prod-2');
  });
});
