/**
 * FeedingService Tests (T120, T121, T123)
 */

import { FeedingService } from '@/features/feeding/services/FeedingService';
import { FeedBatchRepository } from '@/shared/database/repositories/FeedBatchRepository';
import { FeedingRecordRepository } from '@/shared/database/repositories/FeedingRecordRepository';
import { ChickenLotRepository } from '@/shared/database/repositories/ChickenLotRepository';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { FeedBatch, FeedingRecord, ChickenLot } from '@/shared/types/entities';

// Mocks
jest.mock('@/shared/database/repositories/FeedBatchRepository');
jest.mock('@/shared/database/repositories/FeedingRecordRepository');
jest.mock('@/shared/database/repositories/ChickenLotRepository');
jest.mock('@/shared/sync/SyncQueue');

const MockFeedBatchRepository = FeedBatchRepository as jest.MockedClass<
  typeof FeedBatchRepository
>;
const MockFeedingRecordRepository =
  FeedingRecordRepository as jest.MockedClass<typeof FeedingRecordRepository>;
const MockChickenLotRepository = ChickenLotRepository as jest.MockedClass<
  typeof ChickenLotRepository
>;
const MockSyncQueue = SyncQueue as jest.MockedClass<typeof SyncQueue>;

describe('FeedingService', () => {
  let service: FeedingService;
  let mockFeedBatchRepo: jest.Mocked<FeedBatchRepository>;
  let mockFeedingRecordRepo: jest.Mocked<FeedingRecordRepository>;
  let mockLotRepo: jest.Mocked<ChickenLotRepository>;
  let mockSyncQueue: jest.Mocked<SyncQueue>;

  const today = new Date().toISOString().split('T')[0];

  const mockLot: ChickenLot = {
    id: 'lot1',
    chickenHouseId: 'house1',
    name: 'Lote A',
    initialHenCount: 100,
    liveHenCount: 95,
    purchaseDate: '2025-01-01',
    ageWeeks: 20,
    createdBy: 'user1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockBatch: FeedBatch = {
    id: 'batch1',
    batchName: 'Lote Alimento A',
    preparationDate: '2025-01-01',
    quantityKg: 100,
    preparedBy: 'user1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockFeedingRecord: FeedingRecord = {
    id: 'feed_123',
    lotId: 'lot1',
    feedBatchId: 'batch1',
    date: today,
    quantityFedKg: 10,
    recordedBy: 'user1',
    createdAt: `${today}T00:00:00Z`,
    updatedAt: `${today}T00:00:00Z`,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockFeedBatchRepo =
      new MockFeedBatchRepository({} as any) as jest.Mocked<FeedBatchRepository>;
    mockFeedingRecordRepo =
      new MockFeedingRecordRepository({} as any) as jest.Mocked<FeedingRecordRepository>;
    mockLotRepo =
      new MockChickenLotRepository({} as any) as jest.Mocked<ChickenLotRepository>;
    mockSyncQueue =
      new MockSyncQueue({} as any) as jest.Mocked<SyncQueue>;

    mockSyncQueue.enqueue = jest.fn().mockResolvedValue(undefined);

    service = new FeedingService(
      mockFeedBatchRepo,
      mockFeedingRecordRepo,
      mockLotRepo,
      mockSyncQueue
    );
  });

  // ─── createFeedBatch ───────────────────────────────────────────────────────

  describe('createFeedBatch', () => {
    it('creates a feed batch and enqueues sync', async () => {
      mockFeedBatchRepo.create = jest.fn().mockResolvedValue(mockBatch);

      const result = await service.createFeedBatch({
        batchName: 'Lote Alimento A',
        preparationDate: '2025-01-01',
        quantityKg: 100,
        preparedBy: 'user1',
      });

      expect(result.success).toBe(true);
      expect(result.data?.batchName).toBe('Lote Alimento A');
      expect(result.data?.remainingQuantityKg).toBe(100); // full remaining on create
      expect(mockFeedBatchRepo.create).toHaveBeenCalledTimes(1);
      expect(mockSyncQueue.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'feed_batches', operation: 'CREATE' })
      );
    });

    it('returns error for invalid input', async () => {
      const result = await service.createFeedBatch({
        batchName: '',
        preparationDate: '2025-01-01',
        quantityKg: 100,
        preparedBy: 'user1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(mockFeedBatchRepo.create).not.toHaveBeenCalled();
    });

    it('returns error for future date', async () => {
      const result = await service.createFeedBatch({
        batchName: 'Lote',
        preparationDate: '2099-12-31',
        quantityKg: 100,
        preparedBy: 'user1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  // ─── listFeedBatches ───────────────────────────────────────────────────────

  describe('listFeedBatches', () => {
    it('returns batches with computed remaining quantity', async () => {
      mockFeedBatchRepo.findAll = jest.fn().mockResolvedValue([mockBatch]);
      mockFeedingRecordRepo.getTotalFedKgForBatch = jest
        .fn()
        .mockResolvedValue(40);

      const result = await service.listFeedBatches();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].remainingQuantityKg).toBe(60); // 100 - 40
    });

    it('returns empty list when no batches', async () => {
      mockFeedBatchRepo.findAll = jest.fn().mockResolvedValue([]);

      const result = await service.listFeedBatches();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  // ─── recordFeeding ─────────────────────────────────────────────────────────

  describe('recordFeeding', () => {
    it('records feeding and enqueues sync', async () => {
      mockLotRepo.findById = jest.fn().mockResolvedValue(mockLot);
      mockFeedBatchRepo.findById = jest.fn().mockResolvedValue(mockBatch);
      mockFeedingRecordRepo.getTotalFedKgForBatch = jest
        .fn()
        .mockResolvedValue(20);
      mockFeedingRecordRepo.create = jest.fn().mockResolvedValue(mockFeedingRecord);

      const result = await service.recordFeeding({
        lotId: 'lot1',
        feedBatchId: 'batch1',
        date: today,
        quantityFedKg: 10,
        recordedBy: 'user1',
      });

      expect(result.success).toBe(true);
      expect(result.data?.quantityFedKg).toBe(10);
      expect(result.data?.feedPerHen).toBeCloseTo(10 / 95, 4);
      expect(mockSyncQueue.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'feeding_records', operation: 'CREATE' })
      );
    });

    it('returns error when lot not found', async () => {
      mockLotRepo.findById = jest.fn().mockResolvedValue(null);

      const result = await service.recordFeeding({
        lotId: 'nonexistent',
        feedBatchId: 'batch1',
        date: today,
        quantityFedKg: 10,
        recordedBy: 'user1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('lote no existe');
    });

    it('returns error when lot has no live hens', async () => {
      mockLotRepo.findById = jest
        .fn()
        .mockResolvedValue({ ...mockLot, liveHenCount: 0 });

      const result = await service.recordFeeding({
        lotId: 'lot1',
        feedBatchId: 'batch1',
        date: today,
        quantityFedKg: 10,
        recordedBy: 'user1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('sin gallinas vivas');
    });

    it('returns error when feed batch not found', async () => {
      mockLotRepo.findById = jest.fn().mockResolvedValue(mockLot);
      mockFeedBatchRepo.findById = jest.fn().mockResolvedValue(null);

      const result = await service.recordFeeding({
        lotId: 'lot1',
        feedBatchId: 'nonexistent',
        date: today,
        quantityFedKg: 10,
        recordedBy: 'user1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('lote de alimento no existe');
    });

    it('T123: succeeds with warning when quantity exceeds remaining', async () => {
      mockLotRepo.findById = jest.fn().mockResolvedValue(mockLot);
      mockFeedBatchRepo.findById = jest.fn().mockResolvedValue(mockBatch);
      // Only 5 kg remaining (100 - 95 used)
      mockFeedingRecordRepo.getTotalFedKgForBatch = jest
        .fn()
        .mockResolvedValue(95);
      mockFeedingRecordRepo.create = jest.fn().mockResolvedValue(mockFeedingRecord);

      const result = await service.recordFeeding({
        lotId: 'lot1',
        feedBatchId: 'batch1',
        date: today,
        quantityFedKg: 10, // 10 > 5 remaining
        recordedBy: 'user1',
      });

      // Should succeed but with warning
      expect(result.success).toBe(true);
      expect(result.warning).toBeTruthy();
      expect(result.warning).toContain('supera el disponible');
    });
  });

  // ─── getFeedingHistory ─────────────────────────────────────────────────────

  describe('getFeedingHistory', () => {
    it('returns feeding records with feedPerHen computed', async () => {
      mockLotRepo.findById = jest.fn().mockResolvedValue(mockLot);
      mockFeedingRecordRepo.findByLot = jest
        .fn()
        .mockResolvedValue([mockFeedingRecord]);

      const result = await service.getFeedingHistory('lot1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].feedPerHen).toBeCloseTo(10 / 95, 4);
    });

    it('returns error when lot not found', async () => {
      mockLotRepo.findById = jest.fn().mockResolvedValue(null);

      const result = await service.getFeedingHistory('nonexistent');

      expect(result.success).toBe(false);
    });
  });

  // ─── calculateTotalFeedConsumed ────────────────────────────────────────────

  describe('calculateTotalFeedConsumed', () => {
    it('sums all feeding records for a lot', async () => {
      mockFeedingRecordRepo.findByLot = jest.fn().mockResolvedValue([
        { ...mockFeedingRecord, quantityFedKg: 10 },
        { ...mockFeedingRecord, id: 'feed_2', quantityFedKg: 15 },
      ]);

      const result = await service.calculateTotalFeedConsumed('lot1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(25);
    });

    it('returns 0 for lot with no records', async () => {
      mockFeedingRecordRepo.findByLot = jest.fn().mockResolvedValue([]);

      const result = await service.calculateTotalFeedConsumed('lot1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });
  });

  // ─── calculateAverageFeedPerHen ────────────────────────────────────────────

  describe('calculateAverageFeedPerHen', () => {
    it('calculates average feed per hen across records', async () => {
      mockLotRepo.findById = jest.fn().mockResolvedValue(mockLot); // 95 hens
      mockFeedingRecordRepo.findByLot = jest.fn().mockResolvedValue([
        { ...mockFeedingRecord, quantityFedKg: 9.5 }, // 0.1 kg/hen
        { ...mockFeedingRecord, id: 'feed_2', quantityFedKg: 19 }, // 0.2 kg/hen
      ]);

      const result = await service.calculateAverageFeedPerHen('lot1');

      expect(result.success).toBe(true);
      expect(result.data).toBeCloseTo(0.15, 4);
    });

    it('returns 0 for lot with no records', async () => {
      mockLotRepo.findById = jest.fn().mockResolvedValue(mockLot);
      mockFeedingRecordRepo.findByLot = jest.fn().mockResolvedValue([]);

      const result = await service.calculateAverageFeedPerHen('lot1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });
  });
});
