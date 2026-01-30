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

// Mock Firebase Firestore modular functions
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockGetDocs = jest.fn();

// Mock the firebase/firestore module
jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
}));

// Mock Firestore instance
const mockFirestore = {} as any;

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
    mockCollection.mockReturnValue('mock-collection-ref');
    mockDoc.mockReturnValue('mock-doc-ref');
    mockSetDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => null,
      id: 'mock-id',
    });
    mockWhere.mockReturnValue('mock-where-constraint');
    mockQuery.mockReturnValue('mock-query');
    mockGetDocs.mockResolvedValue({
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

      // Verify Firestore functions were called
      expect(mockDoc).toHaveBeenCalledWith(mockFirestore, 'production_records', recordId);
      expect(mockSetDoc).toHaveBeenCalled();

      // Verify data uploaded includes all fields
      const uploadedData = mockSetDoc.mock.calls[0][1];
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

      expect(mockSetDoc).toHaveBeenCalled();
      const uploadedData = mockSetDoc.mock.calls[0][1];
      expect(uploadedData.eggsCollected).toBe(105);
    });

    it('should handle DELETE operations', async () => {
      const recordId = 'prod-123';

      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: recordId,
        operation: 'DELETE',
      });

      await syncService.uploadPendingChanges();

      expect(mockDoc).toHaveBeenCalledWith(mockFirestore, 'production_records', recordId);
      expect(mockDeleteDoc).toHaveBeenCalled();
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

      expect(mockSetDoc).not.toHaveBeenCalled();
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

      mockSetDoc.mockRejectedValue(new Error('Network error'));

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

      mockGetDocs.mockResolvedValue({
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

      mockGetDocs.mockResolvedValue({
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
      mockGetDocs.mockResolvedValue({
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
      mockGetDocs.mockResolvedValue({
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
