/**
 * ProductionRecord Model Unit Tests
 *
 * Tests for ProductionRecord validation, business logic, and helper methods.
 */

import {
  ProductionRecordValidator,
  ProductionRecordFactory,
  ProductionRecordHelper,
  CreateProductionRecordInput,
  ProductionRecord,
} from '@/features/production/models/ProductionRecord';
import { ProductionRecord as ProductionRecordEntity } from '@/shared/types/entities';

describe('ProductionRecord Model', () => {
  describe('ProductionRecordValidator', () => {
    describe('isValidEggsCollected', () => {
      it('should accept positive integers', () => {
        expect(ProductionRecordValidator.isValidEggsCollected(1)).toBe(true);
        expect(ProductionRecordValidator.isValidEggsCollected(100)).toBe(true);
        expect(ProductionRecordValidator.isValidEggsCollected(1000)).toBe(true);
      });

      it('should reject zero and negative numbers', () => {
        expect(ProductionRecordValidator.isValidEggsCollected(0)).toBe(false);
        expect(ProductionRecordValidator.isValidEggsCollected(-1)).toBe(false);
        expect(ProductionRecordValidator.isValidEggsCollected(-100)).toBe(false);
      });

      it('should reject decimals', () => {
        expect(ProductionRecordValidator.isValidEggsCollected(1.5)).toBe(false);
        expect(ProductionRecordValidator.isValidEggsCollected(99.99)).toBe(false);
      });
    });

    describe('isValidDate', () => {
      it('should accept today', () => {
        const today = new Date().toISOString().split('T')[0];
        expect(ProductionRecordValidator.isValidDate(today)).toBe(true);
      });

      it('should accept past dates', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        expect(
          ProductionRecordValidator.isValidDate(yesterday.toISOString().split('T')[0])
        ).toBe(true);
      });

      it('should reject future dates', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        expect(
          ProductionRecordValidator.isValidDate(tomorrow.toISOString().split('T')[0])
        ).toBe(false);
      });
    });

    describe('isValidDateFormat', () => {
      it('should accept valid YYYY-MM-DD format', () => {
        expect(ProductionRecordValidator.isValidDateFormat('2024-01-15')).toBe(true);
        expect(ProductionRecordValidator.isValidDateFormat('2024-12-31')).toBe(true);
      });

      it('should reject invalid formats', () => {
        expect(ProductionRecordValidator.isValidDateFormat('15-01-2024')).toBe(false);
        expect(ProductionRecordValidator.isValidDateFormat('2024/01/15')).toBe(false);
        expect(ProductionRecordValidator.isValidDateFormat('2024-1-15')).toBe(false);
        expect(ProductionRecordValidator.isValidDateFormat('not-a-date')).toBe(false);
      });

      it('should reject invalid date values', () => {
        expect(ProductionRecordValidator.isValidDateFormat('2024-13-01')).toBe(false);
        expect(ProductionRecordValidator.isValidDateFormat('2024-02-30')).toBe(false);
      });
    });

    describe('canRecordProduction', () => {
      it('should allow production for lots with live hens', () => {
        expect(ProductionRecordValidator.canRecordProduction(1)).toBe(true);
        expect(ProductionRecordValidator.canRecordProduction(100)).toBe(true);
      });

      it('should not allow production for lots with zero hens', () => {
        expect(ProductionRecordValidator.canRecordProduction(0)).toBe(false);
      });
    });

    describe('isReasonableProduction', () => {
      it('should accept production at or below 100% (1 egg per hen)', () => {
        expect(ProductionRecordValidator.isReasonableProduction(100, 100)).toBe(true);
        expect(ProductionRecordValidator.isReasonableProduction(80, 100)).toBe(true);
        expect(ProductionRecordValidator.isReasonableProduction(50, 100)).toBe(true);
      });

      it('should reject production above 100%', () => {
        expect(ProductionRecordValidator.isReasonableProduction(101, 100)).toBe(false);
        expect(ProductionRecordValidator.isReasonableProduction(150, 100)).toBe(false);
      });

      it('should reject production for zero-hen lots', () => {
        expect(ProductionRecordValidator.isReasonableProduction(1, 0)).toBe(false);
      });
    });

    describe('validateCreate', () => {
      const validInput: CreateProductionRecordInput = {
        lotId: 'lot-1',
        date: new Date().toISOString().split('T')[0],
        eggsCollected: 100,
        recordedBy: 'user-1',
      };

      it('should validate correct input', () => {
        const result = ProductionRecordValidator.validateCreate(validInput);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should require lotId', () => {
        const result = ProductionRecordValidator.validateCreate({
          ...validInput,
          lotId: '',
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Lote es requerido');
      });

      it('should require date', () => {
        const result = ProductionRecordValidator.validateCreate({
          ...validInput,
          date: '',
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Fecha es requerida');
      });

      it('should validate date format', () => {
        const result = ProductionRecordValidator.validateCreate({
          ...validInput,
          date: 'invalid-date',
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Formato de fecha inválido (debe ser YYYY-MM-DD)');
      });

      it('should reject future dates', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const result = ProductionRecordValidator.validateCreate({
          ...validInput,
          date: tomorrow.toISOString().split('T')[0],
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('La fecha no puede ser futura');
      });

      it('should validate eggsCollected is positive', () => {
        const result = ProductionRecordValidator.validateCreate({
          ...validInput,
          eggsCollected: 0,
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Huevos recolectados debe ser un número positivo');
      });

      it('should require recordedBy', () => {
        const result = ProductionRecordValidator.validateCreate({
          ...validInput,
          recordedBy: '',
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Usuario que registra es requerido');
      });

      it('should return all errors for completely invalid input', () => {
        const result = ProductionRecordValidator.validateCreate({
          lotId: '',
          date: '',
          eggsCollected: -1,
          recordedBy: '',
        });
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
      });
    });
  });

  describe('ProductionRecordFactory', () => {
    describe('create', () => {
      const input: CreateProductionRecordInput = {
        lotId: 'lot-1',
        date: '2024-01-15',
        eggsCollected: 100,
        recordedBy: 'user-1',
      };

      it('should create a production record with all fields', () => {
        const record = ProductionRecordFactory.create(input);

        expect(record.id).toBeDefined();
        expect(record.id).toMatch(/^prod_/);
        expect(record.lotId).toBe(input.lotId);
        expect(record.date).toBe(input.date);
        expect(record.eggsCollected).toBe(input.eggsCollected);
        expect(record.recordedBy).toBe(input.recordedBy);
        expect(record.createdAt).toBeDefined();
        expect(record.updatedAt).toBeDefined();
      });

      it('should generate unique IDs', () => {
        const record1 = ProductionRecordFactory.create(input);
        const record2 = ProductionRecordFactory.create(input);

        expect(record1.id).not.toBe(record2.id);
      });

      it('should set createdAt and updatedAt to current time', () => {
        const before = new Date().toISOString();
        const record = ProductionRecordFactory.create(input);
        const after = new Date().toISOString();

        expect(record.createdAt >= before).toBe(true);
        expect(record.createdAt <= after).toBe(true);
        expect(record.updatedAt >= before).toBe(true);
        expect(record.updatedAt <= after).toBe(true);
      });
    });
  });

  describe('ProductionRecordHelper', () => {
    describe('calculateEggsPerHen', () => {
      it('should calculate eggs per hen correctly', () => {
        expect(ProductionRecordHelper.calculateEggsPerHen(100, 100)).toBe(1.0);
        expect(ProductionRecordHelper.calculateEggsPerHen(80, 100)).toBe(0.8);
        expect(ProductionRecordHelper.calculateEggsPerHen(50, 100)).toBe(0.5);
      });

      it('should round to 2 decimal places', () => {
        expect(ProductionRecordHelper.calculateEggsPerHen(85, 100)).toBe(0.85);
        expect(ProductionRecordHelper.calculateEggsPerHen(333, 1000)).toBe(0.33);
      });

      it('should return 0 for zero hens to avoid division by zero', () => {
        expect(ProductionRecordHelper.calculateEggsPerHen(100, 0)).toBe(0);
      });
    });

    describe('addComputedFields', () => {
      it('should add eggsPerHen computed field', () => {
        const entity: ProductionRecordEntity = {
          id: 'prod-1',
          lotId: 'lot-1',
          date: '2024-01-15',
          eggsCollected: 80,
          recordedBy: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const record = ProductionRecordHelper.addComputedFields(entity, 100);

        expect(record.eggsPerHen).toBe(0.8);
        expect(record.id).toBe(entity.id);
        expect(record.eggsCollected).toBe(entity.eggsCollected);
      });
    });

    describe('calculateEfficiency', () => {
      it('should calculate efficiency as percentage', () => {
        expect(ProductionRecordHelper.calculateEfficiency(1.0)).toBe(100.0);
        expect(ProductionRecordHelper.calculateEfficiency(0.8)).toBe(80.0);
        expect(ProductionRecordHelper.calculateEfficiency(0.5)).toBe(50.0);
      });

      it('should round to 1 decimal place', () => {
        expect(ProductionRecordHelper.calculateEfficiency(0.85)).toBe(85.0);
        expect(ProductionRecordHelper.calculateEfficiency(0.333)).toBe(33.3);
      });
    });

    describe('isLowProduction', () => {
      it('should identify low production (< 70%)', () => {
        expect(ProductionRecordHelper.isLowProduction(0.5)).toBe(true);
        expect(ProductionRecordHelper.isLowProduction(0.69)).toBe(true);
      });

      it('should not flag normal production', () => {
        expect(ProductionRecordHelper.isLowProduction(0.7)).toBe(false);
        expect(ProductionRecordHelper.isLowProduction(0.8)).toBe(false);
        expect(ProductionRecordHelper.isLowProduction(1.0)).toBe(false);
      });
    });

    describe('isOptimalProduction', () => {
      it('should identify optimal production (80-95%)', () => {
        expect(ProductionRecordHelper.isOptimalProduction(0.8)).toBe(true);
        expect(ProductionRecordHelper.isOptimalProduction(0.9)).toBe(true);
        expect(ProductionRecordHelper.isOptimalProduction(0.95)).toBe(true);
      });

      it('should not flag low production', () => {
        expect(ProductionRecordHelper.isOptimalProduction(0.7)).toBe(false);
      });

      it('should not flag above-optimal production', () => {
        expect(ProductionRecordHelper.isOptimalProduction(0.96)).toBe(false);
        expect(ProductionRecordHelper.isOptimalProduction(1.0)).toBe(false);
      });
    });

    describe('sortByDate', () => {
      it('should sort records by date (most recent first)', () => {
        const records: ProductionRecord[] = [
          createMockRecord('2024-01-15', 100, 0.8),
          createMockRecord('2024-01-17', 120, 0.9),
          createMockRecord('2024-01-16', 110, 0.85),
        ];

        const sorted = ProductionRecordHelper.sortByDate(records);

        expect(sorted[0].date).toBe('2024-01-17');
        expect(sorted[1].date).toBe('2024-01-16');
        expect(sorted[2].date).toBe('2024-01-15');
      });

      it('should not mutate original array', () => {
        const records: ProductionRecord[] = [
          createMockRecord('2024-01-15', 100, 0.8),
          createMockRecord('2024-01-17', 120, 0.9),
        ];

        const originalFirstDate = records[0].date;
        ProductionRecordHelper.sortByDate(records);

        expect(records[0].date).toBe(originalFirstDate);
      });
    });

    describe('filterByLot', () => {
      it('should filter records by lot ID', () => {
        const records: ProductionRecord[] = [
          createMockRecord('2024-01-15', 100, 0.8, 'lot-1'),
          createMockRecord('2024-01-16', 110, 0.85, 'lot-2'),
          createMockRecord('2024-01-17', 120, 0.9, 'lot-1'),
        ];

        const filtered = ProductionRecordHelper.filterByLot(records, 'lot-1');

        expect(filtered).toHaveLength(2);
        expect(filtered[0].lotId).toBe('lot-1');
        expect(filtered[1].lotId).toBe('lot-1');
      });

      it('should return empty array if no matches', () => {
        const records: ProductionRecord[] = [
          createMockRecord('2024-01-15', 100, 0.8, 'lot-1'),
        ];

        const filtered = ProductionRecordHelper.filterByLot(records, 'lot-999');

        expect(filtered).toHaveLength(0);
      });
    });

    describe('filterByDateRange', () => {
      it('should filter records within date range', () => {
        const records: ProductionRecord[] = [
          createMockRecord('2024-01-10', 100, 0.8),
          createMockRecord('2024-01-15', 110, 0.85),
          createMockRecord('2024-01-20', 120, 0.9),
          createMockRecord('2024-01-25', 130, 0.95),
        ];

        const filtered = ProductionRecordHelper.filterByDateRange(
          records,
          '2024-01-12',
          '2024-01-22'
        );

        expect(filtered).toHaveLength(2);
        expect(filtered[0].date).toBe('2024-01-15');
        expect(filtered[1].date).toBe('2024-01-20');
      });

      it('should include boundary dates', () => {
        const records: ProductionRecord[] = [
          createMockRecord('2024-01-15', 100, 0.8),
          createMockRecord('2024-01-20', 110, 0.85),
        ];

        const filtered = ProductionRecordHelper.filterByDateRange(
          records,
          '2024-01-15',
          '2024-01-20'
        );

        expect(filtered).toHaveLength(2);
      });
    });

    describe('calculateTotalEggs', () => {
      it('should calculate total eggs collected', () => {
        const records: ProductionRecord[] = [
          createMockRecord('2024-01-15', 100, 0.8),
          createMockRecord('2024-01-16', 110, 0.85),
          createMockRecord('2024-01-17', 120, 0.9),
        ];

        const total = ProductionRecordHelper.calculateTotalEggs(records);

        expect(total).toBe(330);
      });

      it('should return 0 for empty array', () => {
        expect(ProductionRecordHelper.calculateTotalEggs([])).toBe(0);
      });
    });

    describe('calculateAverageEggsPerHen', () => {
      it('should calculate average eggs per hen', () => {
        const records: ProductionRecord[] = [
          createMockRecord('2024-01-15', 100, 0.8),
          createMockRecord('2024-01-16', 110, 0.9),
          createMockRecord('2024-01-17', 120, 1.0),
        ];

        const average = ProductionRecordHelper.calculateAverageEggsPerHen(records);

        expect(average).toBe(0.9);
      });

      it('should return 0 for empty array', () => {
        expect(ProductionRecordHelper.calculateAverageEggsPerHen([])).toBe(0);
      });
    });

    describe('calculateAverageDailyProduction', () => {
      it('should calculate average daily production', () => {
        const records: ProductionRecord[] = [
          createMockRecord('2024-01-15', 100, 0.8),
          createMockRecord('2024-01-16', 110, 0.85),
          createMockRecord('2024-01-17', 120, 0.9),
        ];

        const average = ProductionRecordHelper.calculateAverageDailyProduction(records);

        expect(average).toBe(110);
      });

      it('should return 0 for empty array', () => {
        expect(ProductionRecordHelper.calculateAverageDailyProduction([])).toBe(0);
      });
    });

    describe('findBestDay', () => {
      it('should find the day with highest production', () => {
        const records: ProductionRecord[] = [
          createMockRecord('2024-01-15', 100, 0.8),
          createMockRecord('2024-01-16', 150, 0.9),
          createMockRecord('2024-01-17', 120, 0.85),
        ];

        const best = ProductionRecordHelper.findBestDay(records);

        expect(best?.date).toBe('2024-01-16');
        expect(best?.eggsCollected).toBe(150);
      });

      it('should return null for empty array', () => {
        expect(ProductionRecordHelper.findBestDay([])).toBeNull();
      });
    });

    describe('findWorstDay', () => {
      it('should find the day with lowest production', () => {
        const records: ProductionRecord[] = [
          createMockRecord('2024-01-15', 100, 0.8),
          createMockRecord('2024-01-16', 150, 0.9),
          createMockRecord('2024-01-17', 80, 0.7),
        ];

        const worst = ProductionRecordHelper.findWorstDay(records);

        expect(worst?.date).toBe('2024-01-17');
        expect(worst?.eggsCollected).toBe(80);
      });

      it('should return null for empty array', () => {
        expect(ProductionRecordHelper.findWorstDay([])).toBeNull();
      });
    });

    describe('calculateStatistics', () => {
      it('should calculate comprehensive statistics', () => {
        const records: ProductionRecord[] = [
          createMockRecord('2024-01-15', 100, 0.8),
          createMockRecord('2024-01-16', 150, 0.9),
          createMockRecord('2024-01-17', 80, 0.7),
        ];

        const stats = ProductionRecordHelper.calculateStatistics(records);

        expect(stats.totalEggs).toBe(330);
        expect(stats.averageEggsPerHen).toBe(0.8);
        expect(stats.averageDailyProduction).toBe(110);
        expect(stats.bestDay?.eggsCollected).toBe(150);
        expect(stats.worstDay?.eggsCollected).toBe(80);
        expect(stats.totalDays).toBe(3);
      });

      it('should handle empty array', () => {
        const stats = ProductionRecordHelper.calculateStatistics([]);

        expect(stats.totalEggs).toBe(0);
        expect(stats.averageEggsPerHen).toBe(0);
        expect(stats.averageDailyProduction).toBe(0);
        expect(stats.bestDay).toBeNull();
        expect(stats.worstDay).toBeNull();
        expect(stats.totalDays).toBe(0);
      });
    });

    describe('formatForDisplay', () => {
      it('should format optimal production', () => {
        const record = createMockRecord('2024-01-15', 90, 0.9);
        const formatted = ProductionRecordHelper.formatForDisplay(record);

        expect(formatted.eggs).toBe('90 huevos');
        expect(formatted.efficiency).toBe('90%');
        expect(formatted.status).toBe('optimal');
      });

      it('should format low production', () => {
        const record = createMockRecord('2024-01-15', 60, 0.6);
        const formatted = ProductionRecordHelper.formatForDisplay(record);

        expect(formatted.efficiency).toBe('60%');
        expect(formatted.status).toBe('low');
      });

      it('should format normal production', () => {
        const record = createMockRecord('2024-01-15', 75, 0.75);
        const formatted = ProductionRecordHelper.formatForDisplay(record);

        expect(formatted.efficiency).toBe('75%');
        expect(formatted.status).toBe('normal');
      });
    });

    describe('groupByWeek', () => {
      it('should group records by ISO week', () => {
        // Use dates that are clearly in different weeks (spanning 2+ weeks apart)
        const records: ProductionRecord[] = [
          createMockRecord('2024-01-15', 100, 0.8),
          createMockRecord('2024-01-16', 110, 0.85),
          createMockRecord('2024-01-29', 120, 0.9), // 2 weeks later
        ];

        const grouped = ProductionRecordHelper.groupByWeek(records);

        // Should have at least 2 different week groups
        expect(grouped.size).toBeGreaterThanOrEqual(2);

        // Verify all records are accounted for
        let totalRecords = 0;
        grouped.forEach((weekRecords) => {
          totalRecords += weekRecords.length;
        });
        expect(totalRecords).toBe(3);
      });
    });

    describe('groupByMonth', () => {
      it('should group records by month', () => {
        const records: ProductionRecord[] = [
          createMockRecord('2024-01-15', 100, 0.8),
          createMockRecord('2024-01-20', 110, 0.85),
          createMockRecord('2024-02-10', 120, 0.9),
        ];

        const grouped = ProductionRecordHelper.groupByMonth(records);

        expect(grouped.size).toBe(2);
        expect(grouped.get('2024-01')).toHaveLength(2);
        expect(grouped.get('2024-02')).toHaveLength(1);
      });
    });
  });
});

// Helper function to create mock production records
function createMockRecord(
  date: string,
  eggsCollected: number,
  eggsPerHen: number,
  lotId: string = 'lot-1'
): ProductionRecord {
  return {
    id: `prod-${date}-${lotId}`,
    lotId,
    date,
    eggsCollected,
    recordedBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    eggsPerHen,
  };
}
