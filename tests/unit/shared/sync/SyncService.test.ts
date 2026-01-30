/**
 * SyncService Tests
 *
 * Tests for the Firebase Firestore synchronization service.
 */

import { SyncService } from '@/shared/sync/SyncService';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { ConflictResolver } from '@/shared/sync/ConflictResolver';
import * as SQLite from 'expo-sqlite';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../../utils/testDatabase';

// Mock Firebase Firestore
const mockFirestoreCollection = jest.fn();
const mockFirestoreDoc = jest.fn();
const mockFirestoreSet = jest.fn();
const mockFirestoreGet = jest.fn();
const mockFirestoreWhere = jest.fn();
const mockFirestoreQuery = jest.fn();
const mockFirestoreGetDocs = jest.fn();

const mockFirestore = {
  collection: mockFirestoreCollection,
} as any;

describe('SyncService', () => {
  let db: SQLite.SQLiteDatabase;
  let syncQueue: SyncQueue;
  let conflictResolver: ConflictResolver;
  let syncService: SyncService;

  beforeEach(async () => {
    db = await createTestDatabase();
    syncQueue = new SyncQueue(db);
    conflictResolver = new ConflictResolver();
    syncService = new SyncService(db, mockFirestore, syncQueue, conflictResolver);

    // Create parent records for foreign key constraints
    const now = new Date().toISOString();

    // Create users
    await db.runAsync(
      `INSERT INTO users (id, display_name, role, created_at, updated_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['user-1', 'Test User 1', 'admin', now, now, 1]
    );

    await db.runAsync(
      `INSERT INTO users (id, display_name, role, created_at, updated_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['user-2', 'Test User 2', 'user', now, now, 1]
    );

    // Create chicken house
    await db.runAsync(
      `INSERT INTO chicken_houses (id, name, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      ['house-1', 'Test House', 'user-1', now, now]
    );

    // Create chicken lot
    await db.runAsync(
      `INSERT INTO chicken_lots (id, name, chicken_house_id, purchase_date,
        initial_hen_count, live_hen_count, age_weeks, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['lot-1', 'Test Lot', 'house-1', '2024-01-01', 1000, 1000, 10, 'user-1', now, now]
    );

    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockFirestoreCollection.mockReturnValue({
      doc: mockFirestoreDoc,
      where: mockFirestoreWhere,
    });

    mockFirestoreDoc.mockReturnValue({
      set: mockFirestoreSet,
      get: mockFirestoreGet,
    });

    mockFirestoreSet.mockResolvedValue(undefined);
    mockFirestoreGet.mockResolvedValue({
      exists: () => false,
      data: () => null,
    });

    mockFirestoreWhere.mockReturnValue({
      get: mockFirestoreGetDocs,
    });

    mockFirestoreGetDocs.mockResolvedValue({
      docs: [],
      empty: true,
    });
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
  });

  describe('uploadPendingChanges', () => {
    it('should upload CREATE operations to Firestore', async () => {
      // Create a production record in local DB
      const recordId = 'prod-123';
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [recordId, 'lot-1', '2024-01-15', 100, 'user-1', now, now]
      );

      // Add to sync queue
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: recordId,
        operation: 'CREATE',
      });

      // Upload
      await syncService.uploadPendingChanges();

      // Verify Firestore was called
      expect(mockFirestoreCollection).toHaveBeenCalledWith('production_records');
      expect(mockFirestoreDoc).toHaveBeenCalledWith(recordId);
      expect(mockFirestoreSet).toHaveBeenCalled();

      // Verify data uploaded includes all fields
      const uploadedData = mockFirestoreSet.mock.calls[0][0];
      expect(uploadedData.id).toBe(recordId);
      expect(uploadedData.lotId).toBe('lot-1');
      expect(uploadedData.eggsCollected).toBe(100);
    });

    it('should upload UPDATE operations to Firestore', async () => {
      const recordId = 'prod-123';
      const now = new Date().toISOString();

      // Create and update record
      await db.runAsync(
        `INSERT INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [recordId, 'lot-1', '2024-01-15', 105, 'user-1', now, now]
      );

      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: recordId,
        operation: 'UPDATE',
      });

      await syncService.uploadPendingChanges();

      expect(mockFirestoreSet).toHaveBeenCalled();
      const uploadedData = mockFirestoreSet.mock.calls[0][0];
      expect(uploadedData.eggsCollected).toBe(105);
    });

    it('should handle DELETE operations', async () => {
      const recordId = 'prod-123';

      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: recordId,
        operation: 'DELETE',
      });

      const mockDelete = jest.fn().mockResolvedValue(undefined);
      mockFirestoreDoc.mockReturnValue({
        delete: mockDelete,
      });

      await syncService.uploadPendingChanges();

      expect(mockFirestoreDoc).toHaveBeenCalledWith(recordId);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should mark operations as synced after successful upload', async () => {
      const recordId = 'prod-123';
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [recordId, 'lot-1', '2024-01-15', 100, 'user-1', now, now]
      );

      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: recordId,
        operation: 'CREATE',
      });

      const pendingBefore = await syncQueue.getPending();
      expect(pendingBefore).toHaveLength(1);

      await syncService.uploadPendingChanges();

      const pendingAfter = await syncQueue.getPending();
      expect(pendingAfter).toHaveLength(0);
    });

    it('should handle empty queue', async () => {
      await syncService.uploadPendingChanges();

      expect(mockFirestoreSet).not.toHaveBeenCalled();
    });

    it('should handle upload errors without crashing', async () => {
      const recordId = 'prod-123';
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [recordId, 'lot-1', '2024-01-15', 100, 'user-1', now, now]
      );

      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: recordId,
        operation: 'CREATE',
      });

      mockFirestoreSet.mockRejectedValue(new Error('Network error'));

      await expect(syncService.uploadPendingChanges()).rejects.toThrow(
        'Network error'
      );

      // Queue item should remain pending
      const pending = await syncQueue.getPending();
      expect(pending).toHaveLength(1);
    });
  });

  describe('downloadUpdates', () => {
    it('should download new records from Firestore', async () => {
      const remoteRecord = {
        id: 'prod-remote-1',
        lotId: 'lot-1',
        date: '2024-01-15',
        eggsCollected: 100,
        recordedBy: 'user-2',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      };

      mockFirestoreGetDocs.mockResolvedValue({
        docs: [
          {
            id: remoteRecord.id,
            data: () => remoteRecord,
            exists: () => true,
          },
        ],
        empty: false,
      });

      await syncService.downloadUpdates();

      // Verify record was inserted into local DB
      const localRecord = await db.getFirstAsync<any>(
        'SELECT * FROM production_records WHERE id = ?',
        [remoteRecord.id]
      );

      expect(localRecord).toBeDefined();
      expect(localRecord?.eggs_collected).toBe(100);
    });

    it('should apply conflict resolution for existing records', async () => {
      const recordId = 'prod-conflict-1';

      // Create local version (older)
      await db.runAsync(
        `INSERT INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          recordId,
          'lot-1',
          '2024-01-15',
          100,
          'user-1',
          '2024-01-15T09:00:00.000Z',
          '2024-01-15T09:00:00.000Z',
        ]
      );

      // Remote version (newer)
      const remoteRecord = {
        id: recordId,
        lotId: 'lot-1',
        date: '2024-01-15',
        eggsCollected: 105,
        recordedBy: 'user-2',
        createdAt: '2024-01-15T09:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z', // Newer
      };

      mockFirestoreGetDocs.mockResolvedValue({
        docs: [
          {
            id: remoteRecord.id,
            data: () => remoteRecord,
            exists: () => true,
          },
        ],
        empty: false,
      });

      await syncService.downloadUpdates();

      // Verify remote version won (newer timestamp)
      const localRecord = await db.getFirstAsync<any>(
        'SELECT * FROM production_records WHERE id = ?',
        [recordId]
      );

      expect(localRecord?.eggs_collected).toBe(105);
    });

    it('should handle no updates available', async () => {
      mockFirestoreGetDocs.mockResolvedValue({
        docs: [],
        empty: true,
      });

      await syncService.downloadUpdates();

      // Should complete without errors
      const allRecords = await db.getAllAsync('SELECT * FROM production_records');
      expect(allRecords).toHaveLength(0);
    });
  });

  describe('sync', () => {
    it('should execute full sync cycle (upload then download)', async () => {
      const uploadSpy = jest.spyOn(syncService, 'uploadPendingChanges');
      const downloadSpy = jest.spyOn(syncService, 'downloadUpdates');

      await syncService.sync();

      expect(uploadSpy).toHaveBeenCalled();
      expect(downloadSpy).toHaveBeenCalled();
    });

    it('should return sync statistics', async () => {
      const recordId = 'prod-123';
      const now = new Date().toISOString();

      // Add pending upload
      await db.runAsync(
        `INSERT INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [recordId, 'lot-1', '2024-01-15', 100, 'user-1', now, now]
      );

      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: recordId,
        operation: 'CREATE',
      });

      // Mock download
      mockFirestoreGetDocs.mockResolvedValue({
        docs: [],
        empty: true,
      });

      const result = await syncService.sync();

      expect(result.uploaded).toBe(1);
      expect(result.downloaded).toBe(0);
      expect(result.conflicts).toBe(0);
    });
  });
});
