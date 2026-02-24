/**
 * FeedBatch Model Tests (T118)
 */

import {
  FeedBatchValidator,
  FeedBatchFactory,
  FeedBatchHelper,
  CreateFeedBatchInput,
} from '@/features/feeding/models/FeedBatch';

describe('FeedBatchValidator', () => {
  describe('isValidBatchName', () => {
    it('returns true for non-empty name', () => {
      expect(FeedBatchValidator.isValidBatchName('Lote A')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(FeedBatchValidator.isValidBatchName('')).toBe(false);
    });

    it('returns false for whitespace-only string', () => {
      expect(FeedBatchValidator.isValidBatchName('   ')).toBe(false);
    });
  });

  describe('isValidPreparationDate', () => {
    it('returns true for today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(FeedBatchValidator.isValidPreparationDate(today)).toBe(true);
    });

    it('returns true for past date', () => {
      expect(FeedBatchValidator.isValidPreparationDate('2025-01-01')).toBe(true);
    });

    it('returns false for future date', () => {
      expect(FeedBatchValidator.isValidPreparationDate('2099-12-31')).toBe(false);
    });
  });

  describe('isValidQuantityKg', () => {
    it('returns true for positive number', () => {
      expect(FeedBatchValidator.isValidQuantityKg(50)).toBe(true);
    });

    it('returns true for decimal', () => {
      expect(FeedBatchValidator.isValidQuantityKg(12.5)).toBe(true);
    });

    it('returns false for zero', () => {
      expect(FeedBatchValidator.isValidQuantityKg(0)).toBe(false);
    });

    it('returns false for negative', () => {
      expect(FeedBatchValidator.isValidQuantityKg(-5)).toBe(false);
    });

    it('returns false for Infinity', () => {
      expect(FeedBatchValidator.isValidQuantityKg(Infinity)).toBe(false);
    });
  });

  describe('validateCreate', () => {
    const validInput: CreateFeedBatchInput = {
      batchName: 'Lote Enero',
      preparationDate: '2025-01-15',
      quantityKg: 100,
      preparedBy: 'user1',
    };

    it('returns valid for correct input', () => {
      const result = FeedBatchValidator.validateCreate(validInput);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns error for missing batchName', () => {
      const result = FeedBatchValidator.validateCreate({
        ...validInput,
        batchName: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Nombre del lote de alimento es requerido');
    });

    it('returns error for future preparationDate', () => {
      const result = FeedBatchValidator.validateCreate({
        ...validInput,
        preparationDate: '2099-01-01',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('La fecha de preparación no puede ser futura');
    });

    it('returns error for zero quantityKg', () => {
      const result = FeedBatchValidator.validateCreate({
        ...validInput,
        quantityKg: 0,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cantidad (kg) debe ser un número positivo');
    });

    it('returns error for missing preparedBy', () => {
      const result = FeedBatchValidator.validateCreate({
        ...validInput,
        preparedBy: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Usuario que prepara es requerido');
    });
  });
});

describe('FeedBatchFactory', () => {
  it('creates a feed batch with correct fields', () => {
    const input: CreateFeedBatchInput = {
      batchName: '  Lote Febrero  ',
      preparationDate: '2025-02-01',
      quantityKg: 75.5,
      preparedBy: 'user1',
    };

    const batch = FeedBatchFactory.create(input);

    expect(batch.id).toMatch(/^batch_/);
    expect(batch.batchName).toBe('Lote Febrero'); // trimmed
    expect(batch.preparationDate).toBe('2025-02-01');
    expect(batch.quantityKg).toBe(75.5);
    expect(batch.preparedBy).toBe('user1');
    expect(batch.createdAt).toBeTruthy();
    expect(batch.updatedAt).toBeTruthy();
  });

  it('rounds quantityKg to 2 decimal places', () => {
    const batch = FeedBatchFactory.create({
      batchName: 'Lote Test',
      preparationDate: '2025-01-01',
      quantityKg: 10.12345,
      preparedBy: 'user1',
    });

    expect(batch.quantityKg).toBe(10.12);
  });
});

describe('FeedBatchHelper', () => {
  const batchWithRemaining = {
    id: 'batch1',
    batchName: 'Lote A',
    preparationDate: '2025-01-01',
    quantityKg: 100,
    preparedBy: 'user1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    remainingQuantityKg: 60,
  };

  describe('calculateRemainingQuantityKg', () => {
    it('calculates remaining correctly', () => {
      expect(FeedBatchHelper.calculateRemainingQuantityKg(100, 40)).toBe(60);
    });

    it('clamps to 0 if overused', () => {
      expect(FeedBatchHelper.calculateRemainingQuantityKg(100, 150)).toBe(0);
    });

    it('returns full amount if none fed', () => {
      expect(FeedBatchHelper.calculateRemainingQuantityKg(100, 0)).toBe(100);
    });
  });

  describe('isExhausted', () => {
    it('returns true when remaining is 0', () => {
      expect(
        FeedBatchHelper.isExhausted({ ...batchWithRemaining, remainingQuantityKg: 0 })
      ).toBe(true);
    });

    it('returns false when remaining is positive', () => {
      expect(FeedBatchHelper.isExhausted(batchWithRemaining)).toBe(false);
    });
  });

  describe('wouldExceedRemaining', () => {
    it('returns true when quantity exceeds remaining', () => {
      expect(FeedBatchHelper.wouldExceedRemaining(70, 60)).toBe(true);
    });

    it('returns false when quantity is within remaining', () => {
      expect(FeedBatchHelper.wouldExceedRemaining(50, 60)).toBe(false);
    });

    it('returns false when quantity equals remaining', () => {
      expect(FeedBatchHelper.wouldExceedRemaining(60, 60)).toBe(false);
    });
  });

  describe('formatQuantity', () => {
    it('formats to 2 decimal places with kg suffix', () => {
      expect(FeedBatchHelper.formatQuantity(50)).toBe('50.00 kg');
      expect(FeedBatchHelper.formatQuantity(12.5)).toBe('12.50 kg');
    });
  });
});
