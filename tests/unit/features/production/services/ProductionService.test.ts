/**
 * ProductionService Unit Tests
 *
 * Tests for production recording, metrics calculation, and smart defaults.
 */

import { ProductionService } from '@/features/production/services/ProductionService';
import { ProductionRecordRepository } from '@/shared/database/repositories/ProductionRecordRepository';
import { ChickenLotRepository } from '@/shared/database/repositories/ChickenLotRepository';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { ProductionRecord, ChickenLot, SyncOperation } from '@/shared/types/entities';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

describe('ProductionService', () => {
  let service: ProductionService;
  let mockProductionRepo: jest.Mocked<ProductionRecordRepository>;
  let mockLotRepo: jest.Mocked<ChickenLotRepository>;
  let mockSyncQueue: jest.Mocked<SyncQueue>;

  const mockLot: ChickenLot = {
    id: 'lot-1',
    name: 'Lote A',
    houseId: 'house-1',
    initialHenCount: 100,
    liveHenCount: 95,
    purchaseDate: '2024-01-01',
    ageInWeeks: 20,
    createdBy: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockProductionRecord: ProductionRecord = {
    id: 'prod-1',
    lotId: 'lot-1',
    date: '2024-02-11',
    eggsCollected: 80,
    recordedBy: 'user-1',
    createdAt: '2024-02-11T00:00:00Z',
    updatedAt: '2024-02-11T00:00:00Z',
  };

  beforeEach(() => {
    // Create mocked repositories and services
    mockProductionRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      findByLot: jest.fn(),
      findByDateRange: jest.fn(),
      getTotalEggsForLot: jest.fn(),
      findByLotAndDate: jest.fn(),
    } as any;

    mockLotRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as any;

    mockSyncQueue = {
      enqueue: jest.fn(),
      dequeue: jest.fn(),
      getAllPending: jest.fn(),
      markAsSynced: jest.fn(),
    } as any;

    service = new ProductionService(
      mockProductionRepo,
      mockLotRepo,
      mockSyncQueue
    );

    // Clear AsyncStorage mocks
    jest.clearAllMocks();
  });

  describe('recordProduction', () => {
    it('should successfully record production', async () => {
      mockLotRepo.findById.mockResolvedValue(mockLot);
      mockProductionRepo.findByLotAndDate.mockResolvedValue(null);
      mockProductionRepo.create.mockResolvedValue(mockProductionRecord);
      mockSyncQueue.enqueue.mockResolvedValue(undefined);

      const result = await service.recordProduction(
        'lot-1',
        '2024-02-11',
        80,
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProductionRecord);
      expect(mockProductionRepo.create).toHaveBeenCalled();
      expect(mockSyncQueue.enqueue).toHaveBeenCalledWith({
        entityType: 'production_records',
        entityId: mockProductionRecord.id,
        operation: SyncOperation.Create,
      });
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@production:recent_lot',
        'lot-1'
      );
    });

    it('should reject production for non-existent lot', async () => {
      mockLotRepo.findById.mockResolvedValue(null);

      const result = await service.recordProduction(
        'lot-999',
        '2024-02-11',
        80,
        'user-1'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('no existe');
      expect(mockProductionRepo.create).not.toHaveBeenCalled();
    });

    it('should reject production for lot with zero live hens', async () => {
      const emptyLot = { ...mockLot, liveHenCount: 0 };
      mockLotRepo.findById.mockResolvedValue(emptyLot);

      const result = await service.recordProduction(
        'lot-1',
        '2024-02-11',
        80,
        'user-1'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('sin gallinas vivas');
      expect(mockProductionRepo.create).not.toHaveBeenCalled();
    });

    it('should reject duplicate production for same lot and date', async () => {
      mockLotRepo.findById.mockResolvedValue(mockLot);
      mockProductionRepo.findByLotAndDate.mockResolvedValue(
        mockProductionRecord
      );

      const result = await service.recordProduction(
        'lot-1',
        '2024-02-11',
        80,
        'user-1'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Ya existe un registro');
      expect(mockProductionRepo.create).not.toHaveBeenCalled();
    });

    it('should reject zero eggs collected', async () => {
      mockLotRepo.findById.mockResolvedValue(mockLot);
      mockProductionRepo.findByLotAndDate.mockResolvedValue(null);

      const result = await service.recordProduction(
        'lot-1',
        '2024-02-11',
        0,
        'user-1'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('mayor a 0');
      expect(mockProductionRepo.create).not.toHaveBeenCalled();
    });

    it('should reject negative eggs collected', async () => {
      mockLotRepo.findById.mockResolvedValue(mockLot);
      mockProductionRepo.findByLotAndDate.mockResolvedValue(null);

      const result = await service.recordProduction(
        'lot-1',
        '2024-02-11',
        -10,
        'user-1'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('mayor a 0');
    });

    it('should warn but not reject high production (>2 eggs per hen)', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockLotRepo.findById.mockResolvedValue(mockLot);
      mockProductionRepo.findByLotAndDate.mockResolvedValue(null);
      mockProductionRepo.create.mockResolvedValue(mockProductionRecord);

      // 200 eggs for 95 hens = 2.1 eggs/hen (should warn)
      const result = await service.recordProduction(
        'lot-1',
        '2024-02-11',
        200,
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Alta producción detectada')
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('getProductionHistory', () => {
    it('should return production history for a lot', async () => {
      const mockRecords = [mockProductionRecord];
      mockProductionRepo.findByLot.mockResolvedValue(mockRecords);

      const result = await service.getProductionHistory('lot-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRecords);
      expect(mockProductionRepo.findByLot).toHaveBeenCalledWith('lot-1');
    });

    it('should handle repository errors', async () => {
      mockProductionRepo.findByLot.mockRejectedValue(
        new Error('Database error')
      );

      const result = await service.getProductionHistory('lot-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error al obtener');
    });
  });

  describe('getProductionByDateRange', () => {
    it('should return production records within date range', async () => {
      const mockRecords = [mockProductionRecord];
      mockProductionRepo.findByDateRange.mockResolvedValue(mockRecords);

      const result = await service.getProductionByDateRange(
        '2024-02-01',
        '2024-02-28'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRecords);
      expect(mockProductionRepo.findByDateRange).toHaveBeenCalledWith(
        '2024-02-01',
        '2024-02-28'
      );
    });
  });

  describe('calculateLifetimeEggsPerHen', () => {
    it('should calculate lifetime eggs per hen correctly', async () => {
      mockLotRepo.findById.mockResolvedValue(mockLot);
      mockProductionRepo.getTotalEggsForLot.mockResolvedValue(500);

      const result = await service.calculateLifetimeEggsPerHen('lot-1');

      expect(result.success).toBe(true);
      // 500 eggs / 100 initial hens = 5.00 eggs/hen
      expect(result.data).toBe(5.0);
    });

    it('should return 0 for lot with zero initial hens', async () => {
      const zeroLot = { ...mockLot, initialHenCount: 0 };
      mockLotRepo.findById.mockResolvedValue(zeroLot);
      mockProductionRepo.getTotalEggsForLot.mockResolvedValue(500);

      const result = await service.calculateLifetimeEggsPerHen('lot-1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });

    it('should reject calculation for non-existent lot', async () => {
      mockLotRepo.findById.mockResolvedValue(null);

      const result = await service.calculateLifetimeEggsPerHen('lot-999');

      expect(result.success).toBe(false);
      expect(result.error).toContain('no existe');
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate all production metrics correctly', async () => {
      const recentRecord = {
        ...mockProductionRecord,
        eggsCollected: 85,
        date: '2024-02-11',
      };
      mockLotRepo.findById.mockResolvedValue(mockLot);
      mockProductionRepo.findByLot.mockResolvedValue([recentRecord]);
      mockProductionRepo.getTotalEggsForLot.mockResolvedValue(500);

      const result = await service.calculateMetrics('lot-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        dailyEggsPerHen: 0.89, // 85 / 95 live hens
        lifetimeEggsPerHen: 5.0, // 500 / 100 initial hens
        totalEggs: 500,
        averageDaily: 500, // 500 / 1 record
      });
    });

    it('should return zero metrics for lot with no production', async () => {
      mockLotRepo.findById.mockResolvedValue(mockLot);
      mockProductionRepo.findByLot.mockResolvedValue([]);
      mockProductionRepo.getTotalEggsForLot.mockResolvedValue(0);

      const result = await service.calculateMetrics('lot-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        dailyEggsPerHen: 0,
        lifetimeEggsPerHen: 0,
        totalEggs: 0,
        averageDaily: 0,
      });
    });

    it('should handle lot with zero live hens for daily metric', async () => {
      const emptyLot = { ...mockLot, liveHenCount: 0 };
      const recentRecord = { ...mockProductionRecord, eggsCollected: 85 };
      mockLotRepo.findById.mockResolvedValue(emptyLot);
      mockProductionRepo.findByLot.mockResolvedValue([recentRecord]);
      mockProductionRepo.getTotalEggsForLot.mockResolvedValue(500);

      const result = await service.calculateMetrics('lot-1');

      expect(result.success).toBe(true);
      expect(result.data?.dailyEggsPerHen).toBe(0);
    });
  });

  describe('getAllProductionRecords', () => {
    it('should return all production records', async () => {
      const mockRecords = [mockProductionRecord];
      mockProductionRepo.findAll.mockResolvedValue(mockRecords);

      const result = await service.getAllProductionRecords();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRecords);
      expect(mockProductionRepo.findAll).toHaveBeenCalled();
    });
  });

  describe('getRecentLot', () => {
    it('should return recent lot ID from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('lot-1');

      const result = await service.getRecentLot();

      expect(result).toBe('lot-1');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        '@production:recent_lot'
      );
    });

    it('should return null if no recent lot found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await service.getRecentLot();

      expect(result).toBeNull();
    });

    it('should return null on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const result = await service.getRecentLot();

      expect(result).toBeNull();
    });
  });
});
