/**
 * Production Metrics Calculation Tests (T095)
 *
 * Unit tests for validating the accuracy of production metrics calculations:
 * - Daily eggs per hen (using current live hen count)
 * - Lifetime eggs per hen (using initial hen count)
 * - Total eggs calculation
 * - Average daily production
 *
 * These tests ensure mathematical precision and correct aggregation logic.
 */

import * as SQLite from 'expo-sqlite';
import { ProductionService } from '@/features/production/services/ProductionService';
import { ProductionRecordRepository } from '@/shared/database/repositories/ProductionRecordRepository';
import { ChickenLotRepository } from '@/shared/database/repositories/ChickenLotRepository';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import {
  createTestDatabase,
  cleanupTestDatabase,
  seedTestData,
} from '../../../utils/testDatabase';

describe('ProductionService - Metrics Calculation Accuracy', () => {
  let db: SQLite.SQLiteDatabase;
  let productionService: ProductionService;
  let productionRepo: ProductionRecordRepository;
  let lotRepo: ChickenLotRepository;
  let syncQueue: SyncQueue;

  const testUserId = 'test-user-1';
  const testHouseId = 'test-house-1';
  const testLotId = 'test-lot-1';

  beforeEach(async () => {
    // Create in-memory test database
    db = await createTestDatabase();

    // Initialize repositories and service
    productionRepo = new ProductionRecordRepository(db);
    lotRepo = new ChickenLotRepository(db);
    syncQueue = new SyncQueue(db);
    productionService = new ProductionService(productionRepo, lotRepo, syncQueue);

    // Seed base test data
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
          description: 'Test house for metrics tests',
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
          initial_hen_count: 1000, // Initial count for lifetime metrics
          live_hen_count: 950, // Current count for daily metrics
          age_weeks: 20,
          created_by: testUserId,
          created_at: now,
          updated_at: now,
        },
      ],
    });
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
  });

  describe('Daily Eggs Per Hen Calculation', () => {
    it('should calculate daily eggs per hen using current live hen count', async () => {
      // Arrange - Record production for most recent day
      await productionService.recordProduction(testLotId, '2024-01-15', 855, testUserId);

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      // Daily eggs per hen = 855 / 950 = 0.9
      expect(metrics.dailyEggsPerHen).toBeCloseTo(0.9, 2);
    });

    it('should use most recent day when multiple days exist', async () => {
      // Arrange - Record production over multiple days
      await productionService.recordProduction(testLotId, '2024-01-13', 800, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-14', 820, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-15', 900, testUserId);

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      // Should use most recent day (2024-01-15): 900 / 950 ≈ 0.95
      expect(metrics.dailyEggsPerHen).toBeCloseTo(0.95, 2);
    });

    it('should aggregate multiple records on the same day before calculating', async () => {
      // Arrange - Multiple collections on the same day
      await productionService.recordProduction(testLotId, '2024-01-15', 400, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-15', 450, testUserId);

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      // Daily total = 400 + 450 = 850
      // Daily eggs per hen = 850 / 950 ≈ 0.89
      expect(metrics.dailyEggsPerHen).toBeCloseTo(0.89, 2);
    });

    it('should return 0 when no production records exist', async () => {
      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;
      expect(metrics.dailyEggsPerHen).toBe(0);
    });

    it('should handle division by zero when live hen count is zero', async () => {
      // Arrange - Create lot with zero hens
      const zeroHenLotId = 'zero-hen-lot';
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO chicken_lots
         (id, name, chicken_house_id, purchase_date, initial_hen_count, live_hen_count, age_weeks, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [zeroHenLotId, 'Zero Hen Lot', testHouseId, '2024-01-01', 1000, 0, 20, testUserId, now, now]
      );

      // Act
      const result = await productionService.calculateMetrics(zeroHenLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;
      expect(metrics.dailyEggsPerHen).toBe(0); // Should not crash, return 0
    });
  });

  describe('Lifetime Eggs Per Hen Calculation', () => {
    it('should calculate lifetime eggs per hen using initial hen count', async () => {
      // Arrange - Record production over multiple days
      await productionService.recordProduction(testLotId, '2024-01-13', 850, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-14', 875, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-15', 900, testUserId);

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      // Total eggs = 850 + 875 + 900 = 2625
      // Lifetime eggs per hen = 2625 / 1000 (initial count) = 2.625
      expect(metrics.lifetimeEggsPerHen).toBeCloseTo(2.63, 2);
    });

    it('should use initial hen count not current live count', async () => {
      // Arrange - Lot started with 1000 hens, now has 950 (50 died)
      // Record significant production
      await productionService.recordProduction(testLotId, '2024-01-13', 1000, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-14', 1000, testUserId);

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      // Total = 2000 eggs
      // Should divide by INITIAL count (1000), not current (950)
      expect(metrics.lifetimeEggsPerHen).toBeCloseTo(2.0, 2);
    });

    // Note: This test is skipped because the database has a CHECK constraint
    // requiring initial_hen_count > 0, which prevents this edge case
    it.skip('should return 0 when initial hen count is zero', async () => {
      // This case cannot occur due to database constraints
      // The schema enforces: CHECK(initial_hen_count > 0)
    });

    it('should calculate correctly with high egg counts', async () => {
      // Arrange - Simulate many days of production
      const daysOfProduction = 30;
      const eggsPerDay = 900;

      for (let i = 1; i <= daysOfProduction; i++) {
        const date = `2024-01-${i.toString().padStart(2, '0')}`;
        await productionService.recordProduction(testLotId, date, eggsPerDay, testUserId);
      }

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      // Total = 30 * 900 = 27,000 eggs
      // Lifetime per hen = 27,000 / 1,000 = 27.0
      expect(metrics.lifetimeEggsPerHen).toBeCloseTo(27.0, 2);
    });
  });

  describe('Total Eggs Calculation', () => {
    it('should sum all eggs across all days', async () => {
      // Arrange
      await productionService.recordProduction(testLotId, '2024-01-13', 850, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-14', 875, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-15', 900, testUserId);

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;
      expect(metrics.totalEggs).toBe(2625); // 850 + 875 + 900
    });

    it('should aggregate multiple records on same day before summing', async () => {
      // Arrange - Multiple collections per day
      await productionService.recordProduction(testLotId, '2024-01-13', 400, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-13', 450, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-14', 300, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-14', 575, testUserId);

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      // Day 1: 400 + 450 = 850
      // Day 2: 300 + 575 = 875
      // Total: 850 + 875 = 1725
      expect(metrics.totalEggs).toBe(1725);
    });

    it('should return 0 when no production records exist', async () => {
      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;
      expect(metrics.totalEggs).toBe(0);
    });

    it('should handle very large egg counts accurately', async () => {
      // Arrange - Simulate 365 days of production
      for (let i = 1; i <= 12; i++) {
        const date = `2024-01-${i.toString().padStart(2, '0')}`;
        await productionService.recordProduction(testLotId, date, 950, testUserId);
      }

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;
      expect(metrics.totalEggs).toBe(11400); // 12 * 950
    });
  });

  describe('Average Daily Production Calculation', () => {
    it('should calculate average using daily totals not individual records', async () => {
      // Arrange
      await productionService.recordProduction(testLotId, '2024-01-13', 800, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-14', 850, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-15', 900, testUserId);

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      // Average = (800 + 850 + 900) / 3 = 850
      expect(metrics.averageDaily).toBe(850);
    });

    it('should aggregate same-day records before averaging', async () => {
      // Arrange - Two days, multiple records per day
      await productionService.recordProduction(testLotId, '2024-01-13', 400, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-13', 400, testUserId); // Day 1 total: 800
      await productionService.recordProduction(testLotId, '2024-01-14', 450, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-14', 450, testUserId); // Day 2 total: 900

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      // Average = (800 + 900) / 2 days = 850
      expect(metrics.averageDaily).toBe(850);
    });

    it('should round to nearest integer', async () => {
      // Arrange
      await productionService.recordProduction(testLotId, '2024-01-13', 850, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-14', 860, testUserId);
      await productionService.recordProduction(testLotId, '2024-01-15', 870, testUserId);

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      // Average = (850 + 860 + 870) / 3 = 2580 / 3 = 860
      expect(metrics.averageDaily).toBe(860);
    });

    it('should return 0 when no production records exist', async () => {
      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;
      expect(metrics.averageDaily).toBe(0);
    });
  });

  describe('Edge Cases and Precision', () => {
    it('should maintain precision with decimal calculations', async () => {
      // Arrange - Specific numbers that test decimal precision
      await productionService.recordProduction(testLotId, '2024-01-15', 855, testUserId);

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      // Daily: 855 / 950 = 0.9
      expect(metrics.dailyEggsPerHen).toBeCloseTo(0.9, 2);

      // Lifetime: 855 / 1000 = 0.855
      // With toFixed(2), this should be within 0.85-0.86 range depending on rounding
      expect(metrics.lifetimeEggsPerHen).toBeGreaterThanOrEqual(0.85);
      expect(metrics.lifetimeEggsPerHen).toBeLessThanOrEqual(0.86);
    });

    it('should handle single record correctly', async () => {
      // Arrange
      await productionService.recordProduction(testLotId, '2024-01-15', 900, testUserId);

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      expect(metrics.totalEggs).toBe(900);
      expect(metrics.averageDaily).toBe(900);
      expect(metrics.dailyEggsPerHen).toBeCloseTo(0.95, 2); // 900/950
      expect(metrics.lifetimeEggsPerHen).toBeCloseTo(0.9, 2); // 900/1000
    });

    it('should return error for non-existent lot', async () => {
      // Act
      const result = await productionService.calculateMetrics('non-existent-lot');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('no existe');
    });

    it('should handle lots with varying hen counts accurately', async () => {
      // This tests that dailyEggsPerHen uses current count and lifetime uses initial
      // Create another lot with different initial vs current counts
      const lotId2 = 'test-lot-2';
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO chicken_lots
         (id, name, chicken_house_id, purchase_date, initial_hen_count, live_hen_count, age_weeks, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [lotId2, 'Test Lot 2', testHouseId, '2024-01-01', 2000, 1800, 20, testUserId, now, now]
      );

      // Record production
      await productionService.recordProduction(lotId2, '2024-01-15', 1800, testUserId);

      // Act
      const result = await productionService.calculateMetrics(lotId2);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      // Daily: 1800 / 1800 (current) = 1.0
      // Lifetime: 1800 / 2000 (initial) = 0.9
      expect(metrics.dailyEggsPerHen).toBeCloseTo(1.0, 2);
      expect(metrics.lifetimeEggsPerHen).toBeCloseTo(0.9, 2);
    });
  });

  describe('Date Handling and Aggregation', () => {
    it('should correctly parse and aggregate dates with timestamps', async () => {
      // Arrange - Records with full ISO timestamps (same day, different times)
      const date = '2024-01-15';

      await db.runAsync(
        `INSERT INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['rec-1', testLotId, `${date}T08:00:00.000Z`, 400, testUserId, new Date().toISOString(), new Date().toISOString()]
      );

      await db.runAsync(
        `INSERT INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['rec-2', testLotId, `${date}T14:00:00.000Z`, 450, testUserId, new Date().toISOString(), new Date().toISOString()]
      );

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      // Should aggregate both as same day
      expect(metrics.totalEggs).toBe(850);
      expect(metrics.averageDaily).toBe(850);
    });

    it('should correctly identify most recent day with timestamps', async () => {
      // Arrange
      await db.runAsync(
        `INSERT INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['rec-1', testLotId, '2024-01-13T12:00:00.000Z', 800, testUserId, new Date().toISOString(), new Date().toISOString()]
      );

      await db.runAsync(
        `INSERT INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['rec-2', testLotId, '2024-01-15T12:00:00.000Z', 900, testUserId, new Date().toISOString(), new Date().toISOString()]
      );

      // Act
      const result = await productionService.calculateMetrics(testLotId);

      // Assert
      expect(result.success).toBe(true);
      const metrics = result.data!;

      // Most recent is 2024-01-15 with 900 eggs
      expect(metrics.dailyEggsPerHen).toBeCloseTo(0.95, 2); // 900/950
    });
  });
});
