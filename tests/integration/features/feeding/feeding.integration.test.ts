/**
 * Feed Management Integration Tests (T130, T131, T132)
 *
 * Tests for User Story 4 - Feed Management
 * Validates offline feed batch registration, feeding recording,
 * metrics calculation, and edge cases.
 *
 * Test Scenarios:
 * - T130: Offline feed batch registration and feeding recording with sync
 * - T131: Metrics calculation (total consumed, average per hen)
 * - T132: Edge case - feeding quantity exceeds batch remaining (warn)
 */

import * as SQLite from 'expo-sqlite';
import { FeedingService } from '@/features/feeding/services/FeedingService';
import { FeedBatchRepository } from '@/shared/database/repositories/FeedBatchRepository';
import { FeedingRecordRepository } from '@/shared/database/repositories/FeedingRecordRepository';
import { ChickenLotRepository } from '@/shared/database/repositories/ChickenLotRepository';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import {
  createTestDatabase,
  cleanupTestDatabase,
  seedTestData,
} from '../../../utils/testDatabase';

// Mock Firebase
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockGetDocs = jest.fn();

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

describe('Feed Management Integration Tests', () => {
  let db: SQLite.SQLiteDatabase;
  let feedingService: FeedingService;
  let syncQueue: SyncQueue;

  const testUserId = 'test-user-1';
  const testHouseId = 'test-house-1';
  const testLotId = 'test-lot-1';
  const today = new Date().toISOString().split('T')[0];

  beforeEach(async () => {
    db = await createTestDatabase();

    const feedBatchRepo = new FeedBatchRepository(db);
    const feedingRecordRepo = new FeedingRecordRepository(db);
    const lotRepo = new ChickenLotRepository(db);
    syncQueue = new SyncQueue(db);

    feedingService = new FeedingService(
      feedBatchRepo,
      feedingRecordRepo,
      lotRepo,
      syncQueue
    );

    const now = new Date().toISOString();
    await seedTestData(db, {
      users: [
        {
          id: testUserId,
          display_name: 'Test User',
          role: 'user',
          auth_status: 'authenticated',
          created_at: now,
          updated_at: now,
          is_active: 1,
        },
      ],
      chicken_houses: [
        {
          id: testHouseId,
          name: 'Test House',
          description: 'Test house',
          created_by: testUserId,
          created_at: now,
          updated_at: now,
        },
      ],
      chicken_lots: [
        {
          id: testLotId,
          name: 'Test Lot',
          chicken_house_id: testHouseId,
          purchase_date: '2024-01-01',
          initial_hen_count: 100,
          live_hen_count: 100,
          age_weeks: 20,
          created_by: testUserId,
          created_at: now,
          updated_at: now,
        },
      ],
    });

    jest.clearAllMocks();
    mockCollection.mockReturnValue('mock-collection-ref');
    mockDoc.mockReturnValue('mock-doc-ref');
    mockSetDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => null });
    mockWhere.mockReturnValue('mock-where');
    mockQuery.mockReturnValue('mock-query');
    mockGetDocs.mockResolvedValue({ docs: [], empty: true });
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
  });

  // ─── T130: Offline batch registration and feeding recording ───────────────

  describe('T130 - Offline feed batch and feeding registration', () => {
    it('registers a feed batch offline and stores in SQLite', async () => {
      const result = await feedingService.createFeedBatch({
        batchName: 'Lote Enero',
        preparationDate: today,
        quantityKg: 100,
        preparedBy: testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.data?.batchName).toBe('Lote Enero');
      expect(result.data?.quantityKg).toBe(100);
      expect(result.data?.remainingQuantityKg).toBe(100);

      // Verify persisted in SQLite
      const batchRow = await db.getFirstAsync<any>(
        'SELECT * FROM feed_batches WHERE id = ?',
        [result.data!.id]
      );
      expect(batchRow).not.toBeNull();
      expect(batchRow.batch_name).toBe('Lote Enero');
    });

    it('creates a feed batch sync queue entry', async () => {
      const result = await feedingService.createFeedBatch({
        batchName: 'Lote Sync Test',
        preparationDate: today,
        quantityKg: 50,
        preparedBy: testUserId,
      });

      expect(result.success).toBe(true);

      const pending = await db.getAllAsync<any>(
        "SELECT * FROM sync_queue WHERE entity_type = 'feed_batches' AND entity_id = ?",
        [result.data!.id]
      );
      expect(pending.length).toBe(1);
      expect(pending[0].operation).toBe('CREATE');
    });

    it('records a feeding event offline for a valid lot', async () => {
      // Create batch first
      const batchResult = await feedingService.createFeedBatch({
        batchName: 'Lote Para Registrar',
        preparationDate: today,
        quantityKg: 100,
        preparedBy: testUserId,
      });
      expect(batchResult.success).toBe(true);

      // Record feeding
      const feedResult = await feedingService.recordFeeding({
        lotId: testLotId,
        feedBatchId: batchResult.data!.id,
        date: today,
        quantityFedKg: 10,
        recordedBy: testUserId,
      });

      expect(feedResult.success).toBe(true);
      expect(feedResult.data?.quantityFedKg).toBe(10);
      expect(feedResult.data?.feedPerHen).toBeCloseTo(10 / 100, 4);

      // Verify persisted in SQLite
      const row = await db.getFirstAsync<any>(
        'SELECT * FROM feeding_records WHERE id = ?',
        [feedResult.data!.id]
      );
      expect(row).not.toBeNull();
      expect(row.quantity_fed_kg).toBe(10);
    });

    it('creates a feeding record sync queue entry', async () => {
      const batchResult = await feedingService.createFeedBatch({
        batchName: 'Batch Sync',
        preparationDate: today,
        quantityKg: 100,
        preparedBy: testUserId,
      });

      const feedResult = await feedingService.recordFeeding({
        lotId: testLotId,
        feedBatchId: batchResult.data!.id,
        date: today,
        quantityFedKg: 5,
        recordedBy: testUserId,
      });

      expect(feedResult.success).toBe(true);

      const pending = await db.getAllAsync<any>(
        "SELECT * FROM sync_queue WHERE entity_type = 'feeding_records' AND entity_id = ?",
        [feedResult.data!.id]
      );
      expect(pending.length).toBe(1);
      expect(pending[0].operation).toBe('CREATE');
    });

    it('returns error when lot does not exist', async () => {
      const batchResult = await feedingService.createFeedBatch({
        batchName: 'Lote',
        preparationDate: today,
        quantityKg: 100,
        preparedBy: testUserId,
      });

      const result = await feedingService.recordFeeding({
        lotId: 'nonexistent-lot',
        feedBatchId: batchResult.data!.id,
        date: today,
        quantityFedKg: 10,
        recordedBy: testUserId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('lote no existe');
    });
  });

  // ─── T131: Metrics calculation ────────────────────────────────────────────

  describe('T131 - Metrics calculation', () => {
    it('calculates total feed consumed for a lot', async () => {
      const batchResult = await feedingService.createFeedBatch({
        batchName: 'Lote Métricas',
        preparationDate: today,
        quantityKg: 200,
        preparedBy: testUserId,
      });
      const batchId = batchResult.data!.id;

      // Record 3 feedings
      await feedingService.recordFeeding({
        lotId: testLotId,
        feedBatchId: batchId,
        date: today,
        quantityFedKg: 10,
        recordedBy: testUserId,
      });
      await feedingService.recordFeeding({
        lotId: testLotId,
        feedBatchId: batchId,
        date: today,
        quantityFedKg: 15,
        recordedBy: testUserId,
      });
      await feedingService.recordFeeding({
        lotId: testLotId,
        feedBatchId: batchId,
        date: today,
        quantityFedKg: 20,
        recordedBy: testUserId,
      });

      const totalResult = await feedingService.calculateTotalFeedConsumed(testLotId);
      expect(totalResult.success).toBe(true);
      expect(totalResult.data).toBe(45);
    });

    it('calculates average feed per hen correctly', async () => {
      const batchResult = await feedingService.createFeedBatch({
        batchName: 'Lote Avg',
        preparationDate: today,
        quantityKg: 200,
        preparedBy: testUserId,
      });
      const batchId = batchResult.data!.id;

      // 100 hens in lot, feed 10kg → 0.1 kg/hen each time
      await feedingService.recordFeeding({
        lotId: testLotId,
        feedBatchId: batchId,
        date: today,
        quantityFedKg: 10, // 0.1/hen
        recordedBy: testUserId,
      });
      await feedingService.recordFeeding({
        lotId: testLotId,
        feedBatchId: batchId,
        date: today,
        quantityFedKg: 20, // 0.2/hen
        recordedBy: testUserId,
      });

      const avgResult = await feedingService.calculateAverageFeedPerHen(testLotId);
      expect(avgResult.success).toBe(true);
      // Average of 0.1 and 0.2 = 0.15
      expect(avgResult.data).toBeCloseTo(0.15, 4);
    });

    it('listFeedBatches shows correct remaining quantity', async () => {
      const batchResult = await feedingService.createFeedBatch({
        batchName: 'Lote Remaining',
        preparationDate: today,
        quantityKg: 100,
        preparedBy: testUserId,
      });

      // Feed 30kg
      await feedingService.recordFeeding({
        lotId: testLotId,
        feedBatchId: batchResult.data!.id,
        date: today,
        quantityFedKg: 30,
        recordedBy: testUserId,
      });

      const listResult = await feedingService.listFeedBatches();
      expect(listResult.success).toBe(true);

      const batch = listResult.data!.find((b) => b.id === batchResult.data!.id);
      expect(batch).toBeDefined();
      expect(batch!.remainingQuantityKg).toBe(70); // 100 - 30
    });
  });

  // ─── T132: Edge case - exceeds remaining ──────────────────────────────────

  describe('T132 - Feeding quantity exceeds batch remaining', () => {
    it('succeeds with warning when quantity exceeds remaining (non-blocking)', async () => {
      // Create batch with only 5 kg
      const batchResult = await feedingService.createFeedBatch({
        batchName: 'Lote Pequeño',
        preparationDate: today,
        quantityKg: 5,
        preparedBy: testUserId,
      });

      // Try to feed 10kg (exceeds 5kg available)
      const result = await feedingService.recordFeeding({
        lotId: testLotId,
        feedBatchId: batchResult.data!.id,
        date: today,
        quantityFedKg: 10,
        recordedBy: testUserId,
      });

      // Must succeed (non-blocking per T123)
      expect(result.success).toBe(true);
      // Must have warning
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('supera el disponible');
      // Record is actually saved
      expect(result.data?.quantityFedKg).toBe(10);
    });

    it('does NOT fail when feeding within remaining limit', async () => {
      const batchResult = await feedingService.createFeedBatch({
        batchName: 'Lote Grande',
        preparationDate: today,
        quantityKg: 100,
        preparedBy: testUserId,
      });

      const result = await feedingService.recordFeeding({
        lotId: testLotId,
        feedBatchId: batchResult.data!.id,
        date: today,
        quantityFedKg: 50, // within 100kg
        recordedBy: testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('remaining quantity reflects all feedings cumulatively', async () => {
      const batchResult = await feedingService.createFeedBatch({
        batchName: 'Lote Cumulativo',
        preparationDate: today,
        quantityKg: 30,
        preparedBy: testUserId,
      });
      const batchId = batchResult.data!.id;

      // Feed 20kg (10 remaining)
      await feedingService.recordFeeding({
        lotId: testLotId,
        feedBatchId: batchId,
        date: today,
        quantityFedKg: 20,
        recordedBy: testUserId,
      });

      // Feed 15kg → should warn (only 10 remaining)
      const result = await feedingService.recordFeeding({
        lotId: testLotId,
        feedBatchId: batchId,
        date: today,
        quantityFedKg: 15,
        recordedBy: testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.warning).toBeDefined();
    });
  });
});
