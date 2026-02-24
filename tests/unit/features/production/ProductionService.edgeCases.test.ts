/**
 * Production Service Edge Cases Tests (T097, T098)
 *
 * Unit tests for validating edge case handling:
 * - Future date rejection
 * - Production for lot with zero hens
 * - Invalid date formats
 * - Boundary conditions
 *
 * These tests ensure the service properly validates and rejects invalid inputs.
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

describe('ProductionService - Edge Cases', () => {
  let db: SQLite.SQLiteDatabase;
  let productionService: ProductionService;
  let productionRepo: ProductionRecordRepository;
  let lotRepo: ChickenLotRepository;
  let syncQueue: SyncQueue;

  const testUserId = 'test-user-1';
  const testHouseId = 'test-house-1';
  const testLotId = 'test-lot-1';
  const testLotIdZeroHens = 'test-lot-zero-hens';

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
          description: 'Test house for edge cases',
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
          initial_hen_count: 1000,
          live_hen_count: 950,
          age_weeks: 20,
          created_by: testUserId,
          created_at: now,
          updated_at: now,
        },
        {
          id: testLotIdZeroHens,
          name: 'Test Lot Zero Hens',
          chicken_house_id: testHouseId,
          purchase_date: '2024-01-01',
          initial_hen_count: 1000,
          live_hen_count: 0, // All hens dead/sold
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

  describe('Future Date Rejection (T097)', () => {
    it('should reject production record with tomorrow\'s date', async () => {
      // Arrange - Calculate tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Act
      const result = await productionService.recordProduction(
        testLotId,
        tomorrowStr,
        850,
        testUserId
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('fecha');
      expect(result.error).toContain('futura');
      expect(result.data).toBeUndefined();
    });

    it('should reject production record with next week\'s date', async () => {
      // Arrange - Calculate date one week from now
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      // Act
      const result = await productionService.recordProduction(
        testLotId,
        nextWeekStr,
        850,
        testUserId
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('fecha');
    });

    it('should reject production record with next month\'s date', async () => {
      // Arrange - Calculate date one month from now
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().split('T')[0];

      // Act
      const result = await productionService.recordProduction(
        testLotId,
        nextMonthStr,
        850,
        testUserId
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('fecha');
    });

    it('should reject production record with next year\'s date', async () => {
      // Arrange - Calculate date one year from now
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const nextYearStr = nextYear.toISOString().split('T')[0];

      // Act
      const result = await productionService.recordProduction(
        testLotId,
        nextYearStr,
        850,
        testUserId
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('fecha');
    });

    it('should accept production record with today\'s date', async () => {
      // Arrange - Use today's date
      const today = new Date().toISOString().split('T')[0];

      // Act
      const result = await productionService.recordProduction(
        testLotId,
        today,
        850,
        testUserId
      );

      // Assert - Today should be valid
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.record.date).toBe(today);
    });

    it('should accept production record with yesterday\'s date', async () => {
      // Arrange - Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Act
      const result = await productionService.recordProduction(
        testLotId,
        yesterdayStr,
        850,
        testUserId
      );

      // Assert - Past dates should be valid
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.record.date).toBe(yesterdayStr);
    });

    it('should accept production record with last week\'s date', async () => {
      // Arrange - Calculate date one week ago
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekStr = lastWeek.toISOString().split('T')[0];

      // Act
      const result = await productionService.recordProduction(
        testLotId,
        lastWeekStr,
        850,
        testUserId
      );

      // Assert - Past dates should be valid
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle exact boundary: current date at different times', async () => {
      // This test verifies that time of day doesn't affect date validation
      // The validation should only compare YYYY-MM-DD parts

      // Arrange
      const today = new Date().toISOString().split('T')[0];

      // Act - Record multiple times throughout the "day"
      const result1 = await productionService.recordProduction(
        testLotId,
        today,
        400,
        testUserId
      );

      const result2 = await productionService.recordProduction(
        testLotId,
        today,
        450,
        testUserId
      );

      // Assert - Both should succeed regardless of exact timestamp
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should provide clear error message for future date', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Act
      const result = await productionService.recordProduction(
        testLotId,
        tomorrowStr,
        850,
        testUserId
      );

      // Assert - Error message should be user-friendly in Spanish
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/fecha.*no.*puede.*ser.*futura/i);
    });

    it('should not save production record when date is invalid', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Act
      await productionService.recordProduction(
        testLotId,
        tomorrowStr,
        850,
        testUserId
      );

      // Assert - Verify no record was created in database
      const records = await productionRepo.findByLot(testLotId);
      expect(records.length).toBe(0);
    });

    it('should not enqueue sync when future date is rejected', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Act
      await productionService.recordProduction(
        testLotId,
        tomorrowStr,
        850,
        testUserId
      );

      // Assert - Verify no sync queue entry was created
      const pendingSync = await db.getAllAsync(
        'SELECT * FROM sync_queue WHERE synced_at IS NULL'
      );
      expect(pendingSync.length).toBe(0);
    });
  });

  describe('Invalid Date Format', () => {
    it('should reject date with invalid format (MM/DD/YYYY)', async () => {
      // Arrange - US format instead of ISO
      const invalidDate = '01/15/2024';

      // Act
      const result = await productionService.recordProduction(
        testLotId,
        invalidDate,
        850,
        testUserId
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('fecha');
    });

    it('should reject date with invalid format (DD-MM-YYYY)', async () => {
      // Arrange - European format with dashes
      const invalidDate = '15-01-2024';

      // Act
      const result = await productionService.recordProduction(
        testLotId,
        invalidDate,
        850,
        testUserId
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('fecha');
    });

    it('should reject date with invalid month (13)', async () => {
      // Arrange - Month 13 doesn't exist
      const invalidDate = '2024-13-01';

      // Act
      const result = await productionService.recordProduction(
        testLotId,
        invalidDate,
        850,
        testUserId
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('fecha');
    });

    it('should reject date with invalid day (32)', async () => {
      // Arrange - Day 32 doesn't exist
      const invalidDate = '2024-01-32';

      // Act
      const result = await productionService.recordProduction(
        testLotId,
        invalidDate,
        850,
        testUserId
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('fecha');
    });

    it('should reject empty date string', async () => {
      // Arrange
      const emptyDate = '';

      // Act
      const result = await productionService.recordProduction(
        testLotId,
        emptyDate,
        850,
        testUserId
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.toLowerCase()).toContain('fecha');
    });

    it('should reject date with only whitespace', async () => {
      // Arrange
      const whitespaceDate = '   ';

      // Act
      const result = await productionService.recordProduction(
        testLotId,
        whitespaceDate,
        850,
        testUserId
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.toLowerCase()).toContain('fecha');
    });
  });

  describe('Production for Lot with Zero Hens (T098)', () => {
    it('should reject production for lot with zero live hens', async () => {
      // Arrange
      const today = new Date().toISOString().split('T')[0];

      // Act - Try to record production for lot with 0 live hens
      const result = await productionService.recordProduction(
        testLotIdZeroHens,
        today,
        100,
        testUserId
      );

      // Assert - Should be rejected
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/gallinas.*vivas/i);
      expect(result.data).toBeUndefined();
    });

    it('should provide clear error message for zero hens', async () => {
      // Arrange
      const today = new Date().toISOString().split('T')[0];

      // Act
      const result = await productionService.recordProduction(
        testLotIdZeroHens,
        today,
        100,
        testUserId
      );

      // Assert - Error message should be user-friendly
      expect(result.success).toBe(false);
      expect(result.error).toContain('No se puede registrar producción');
      expect(result.error).toContain('gallinas vivas');
    });

    it('should not save production record for zero hens lot', async () => {
      // Arrange
      const today = new Date().toISOString().split('T')[0];

      // Act
      await productionService.recordProduction(
        testLotIdZeroHens,
        today,
        100,
        testUserId
      );

      // Assert - Verify no record was created
      const records = await productionRepo.findByLot(testLotIdZeroHens);
      expect(records.length).toBe(0);
    });

    it('should not enqueue sync for rejected zero hens production', async () => {
      // Arrange
      const today = new Date().toISOString().split('T')[0];

      // Act
      await productionService.recordProduction(
        testLotIdZeroHens,
        today,
        100,
        testUserId
      );

      // Assert - Verify no sync queue entry
      const pendingSync = await db.getAllAsync(
        'SELECT * FROM sync_queue WHERE entity_type = ? AND entity_id LIKE ?',
        ['production_records', `%${testLotIdZeroHens}%`]
      );
      expect(pendingSync.length).toBe(0);
    });

    it('should reject even small egg counts for zero hens lot', async () => {
      // Arrange
      const today = new Date().toISOString().split('T')[0];

      // Act - Try with just 1 egg
      const result = await productionService.recordProduction(
        testLotIdZeroHens,
        today,
        1,
        testUserId
      );

      // Assert - Should still be rejected
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/gallinas.*vivas/i);
    });

    it('should allow production for lot with at least 1 live hen', async () => {
      // This test verifies the boundary: 0 hens = reject, 1+ hens = allow

      // The existing test lot has 950 live hens, which is > 0
      // So it should allow production
      const today = new Date().toISOString().split('T')[0];

      const result = await productionService.recordProduction(
        testLotId,
        today,
        100,
        testUserId
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Combined Edge Cases', () => {
    it('should reject future date even for lot with hens', async () => {
      // Test that multiple validations work together
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const result = await productionService.recordProduction(
        testLotId, // Valid lot with hens
        tomorrowStr, // Invalid: future date
        850, // Valid eggs count
        testUserId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('fecha');
    });

    it('should reject zero hens even with valid date', async () => {
      // Test that multiple validations work together
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const result = await productionService.recordProduction(
        testLotIdZeroHens, // Invalid: zero hens
        yesterdayStr, // Valid: past date
        100, // Valid eggs count
        testUserId
      );

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/gallinas.*vivas/i);
    });

    it('should prioritize date validation error over zero hens error', async () => {
      // When both validations fail, date validation should be checked first
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const result = await productionService.recordProduction(
        testLotIdZeroHens, // Invalid: zero hens
        tomorrowStr, // Invalid: future date
        100,
        testUserId
      );

      expect(result.success).toBe(false);
      // Should get date error since date validation happens before lot check
      expect(result.error).toContain('fecha');
    });
  });
});
