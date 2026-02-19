/**
 * FeedingRecord Model Tests (T119)
 */

import {
  FeedingRecordValidator,
  FeedingRecordFactory,
  FeedingRecordHelper,
  CreateFeedingRecordInput,
} from '@/features/feeding/models/FeedingRecord';

describe('FeedingRecordValidator', () => {
  describe('isValidDate', () => {
    it('returns true for today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(FeedingRecordValidator.isValidDate(today)).toBe(true);
    });

    it('returns true for past date', () => {
      expect(FeedingRecordValidator.isValidDate('2025-01-01')).toBe(true);
    });

    it('returns false for future date', () => {
      expect(FeedingRecordValidator.isValidDate('2099-12-31')).toBe(false);
    });
  });

  describe('isValidQuantityFedKg', () => {
    it('returns true for positive decimal', () => {
      expect(FeedingRecordValidator.isValidQuantityFedKg(5.5)).toBe(true);
    });

    it('returns false for zero', () => {
      expect(FeedingRecordValidator.isValidQuantityFedKg(0)).toBe(false);
    });

    it('returns false for negative', () => {
      expect(FeedingRecordValidator.isValidQuantityFedKg(-1)).toBe(false);
    });

    it('returns false for Infinity', () => {
      expect(FeedingRecordValidator.isValidQuantityFedKg(Infinity)).toBe(false);
    });
  });

  describe('validateCreate', () => {
    const validInput: CreateFeedingRecordInput = {
      lotId: 'lot1',
      feedBatchId: 'batch1',
      date: '2025-01-15',
      quantityFedKg: 10,
      recordedBy: 'user1',
    };

    it('returns valid for correct input', () => {
      const result = FeedingRecordValidator.validateCreate(validInput);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns error for missing lotId', () => {
      const result = FeedingRecordValidator.validateCreate({
        ...validInput,
        lotId: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Lote es requerido');
    });

    it('returns error for missing feedBatchId', () => {
      const result = FeedingRecordValidator.validateCreate({
        ...validInput,
        feedBatchId: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Lote de alimento es requerido');
    });

    it('returns error for future date', () => {
      const result = FeedingRecordValidator.validateCreate({
        ...validInput,
        date: '2099-01-01',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('La fecha no puede ser futura');
    });

    it('returns error for zero quantityFedKg', () => {
      const result = FeedingRecordValidator.validateCreate({
        ...validInput,
        quantityFedKg: 0,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Cantidad suministrada (kg) debe ser un número positivo'
      );
    });

    it('returns error for missing recordedBy', () => {
      const result = FeedingRecordValidator.validateCreate({
        ...validInput,
        recordedBy: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Usuario que registra es requerido');
    });
  });
});

describe('FeedingRecordFactory', () => {
  it('creates a feeding record with correct fields', () => {
    const input: CreateFeedingRecordInput = {
      lotId: 'lot1',
      feedBatchId: 'batch1',
      date: '2025-01-15',
      quantityFedKg: 8.75,
      recordedBy: 'user1',
    };

    const record = FeedingRecordFactory.create(input);

    expect(record.id).toMatch(/^feed_/);
    expect(record.lotId).toBe('lot1');
    expect(record.feedBatchId).toBe('batch1');
    expect(record.date).toBe('2025-01-15');
    expect(record.quantityFedKg).toBe(8.75);
    expect(record.recordedBy).toBe('user1');
    expect(record.createdAt).toBeTruthy();
    expect(record.updatedAt).toBeTruthy();
  });

  it('rounds quantityFedKg to 2 decimal places', () => {
    const record = FeedingRecordFactory.create({
      lotId: 'lot1',
      feedBatchId: 'batch1',
      date: '2025-01-15',
      quantityFedKg: 8.12345,
      recordedBy: 'user1',
    });

    expect(record.quantityFedKg).toBe(8.12);
  });
});

describe('FeedingRecordHelper', () => {
  const makeRecord = (quantityFedKg: number, feedPerHen: number) => ({
    id: 'rec1',
    lotId: 'lot1',
    feedBatchId: 'batch1',
    date: '2025-01-15',
    quantityFedKg,
    recordedBy: 'user1',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    feedPerHen,
  });

  describe('calculateFeedPerHen', () => {
    it('calculates feed per hen correctly', () => {
      expect(FeedingRecordHelper.calculateFeedPerHen(100, 50)).toBe(2.0);
    });

    it('returns 0 when liveHenCount is 0', () => {
      expect(FeedingRecordHelper.calculateFeedPerHen(100, 0)).toBe(0);
    });

    it('rounds to 4 decimal places', () => {
      expect(FeedingRecordHelper.calculateFeedPerHen(10, 3)).toBe(3.3333);
    });
  });

  describe('calculateTotalFeedConsumed', () => {
    it('sums all quantities', () => {
      const records = [
        makeRecord(10, 0.1),
        makeRecord(15, 0.15),
        makeRecord(20, 0.2),
      ];
      expect(FeedingRecordHelper.calculateTotalFeedConsumed(records)).toBe(45);
    });

    it('returns 0 for empty list', () => {
      expect(FeedingRecordHelper.calculateTotalFeedConsumed([])).toBe(0);
    });
  });

  describe('calculateAverageFeedPerHen', () => {
    it('calculates average correctly', () => {
      const records = [makeRecord(10, 2.0), makeRecord(20, 4.0)];
      expect(FeedingRecordHelper.calculateAverageFeedPerHen(records)).toBe(3.0);
    });

    it('returns 0 for empty list', () => {
      expect(FeedingRecordHelper.calculateAverageFeedPerHen([])).toBe(0);
    });
  });

  describe('sortByDate', () => {
    it('sorts records most recent first', () => {
      const records = [
        makeRecord(10, 0.1),
        { ...makeRecord(20, 0.2), date: '2025-01-10' },
        { ...makeRecord(30, 0.3), date: '2025-01-20' },
      ];
      // Override date on first
      records[0] = { ...records[0], date: '2025-01-15' };

      const sorted = FeedingRecordHelper.sortByDate(records);
      expect(sorted[0].date).toBe('2025-01-20');
      expect(sorted[1].date).toBe('2025-01-15');
      expect(sorted[2].date).toBe('2025-01-10');
    });
  });
});
