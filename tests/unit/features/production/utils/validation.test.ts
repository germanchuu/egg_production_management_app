/**
 * Production Validation Unit Tests
 *
 * Tests for production validation schemas and helper functions.
 */

import {
  productionRecordSchema,
  validateLotHasLiveHens,
  validateEggsCollectedIsReasonable,
  needsSanityCheckWarning,
  getSanityCheckWarningMessage,
  isOptimalProduction,
  isLowProduction,
  getProductionStatus,
} from '@/features/production/utils/validation';

describe('Production Validation', () => {
  describe('productionRecordSchema', () => {
    const validData = {
      lotId: 'lot-1',
      date: new Date().toISOString().split('T')[0],
      eggsCollected: 80,
    };

    it('should accept valid production data', () => {
      const result = productionRecordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    describe('lotId validation', () => {
      it('should require lotId', () => {
        const result = productionRecordSchema.safeParse({
          ...validData,
          lotId: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('seleccionar un lote');
        }
      });
    });

    describe('date validation', () => {
      it('should accept today', () => {
        const today = new Date().toISOString().split('T')[0];
        const result = productionRecordSchema.safeParse({
          ...validData,
          date: today,
        });
        expect(result.success).toBe(true);
      });

      it('should accept past dates', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const result = productionRecordSchema.safeParse({
          ...validData,
          date: yesterday.toISOString().split('T')[0],
        });
        expect(result.success).toBe(true);
      });

      it('should reject future dates', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const result = productionRecordSchema.safeParse({
          ...validData,
          date: tomorrow.toISOString().split('T')[0],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('no puede estar en el futuro');
        }
      });
    });

    describe('eggsCollected validation', () => {
      it('should accept positive integers', () => {
        const result = productionRecordSchema.safeParse({
          ...validData,
          eggsCollected: 100,
        });
        expect(result.success).toBe(true);
      });

      it('should reject zero eggs', () => {
        const result = productionRecordSchema.safeParse({
          ...validData,
          eggsCollected: 0,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('mayor a 0');
        }
      });

      it('should reject negative eggs', () => {
        const result = productionRecordSchema.safeParse({
          ...validData,
          eggsCollected: -10,
        });
        expect(result.success).toBe(false);
      });

      it('should reject decimal values', () => {
        const result = productionRecordSchema.safeParse({
          ...validData,
          eggsCollected: 10.5,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('número entero');
        }
      });
    });
  });

  describe('validateLotHasLiveHens', () => {
    it('should accept lot with live hens', () => {
      const result = validateLotHasLiveHens(100);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject lot with zero hens', () => {
      const result = validateLotHasLiveHens(0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('sin gallinas vivas');
    });

    it('should reject lot with negative hens', () => {
      const result = validateLotHasLiveHens(-1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('sin gallinas vivas');
    });
  });

  describe('validateEggsCollectedIsReasonable', () => {
    it('should accept reasonable production (80 eggs for 100 hens)', () => {
      const result = validateEggsCollectedIsReasonable(80, 100);
      expect(result.valid).toBe(true);
    });

    it('should accept 100% production (1 egg per hen)', () => {
      const result = validateEggsCollectedIsReasonable(100, 100);
      expect(result.valid).toBe(true);
    });

    it('should reject production exceeding 1 egg per hen', () => {
      const result = validateEggsCollectedIsReasonable(101, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('máximo teórico');
    });

    it('should reject production for lot with zero hens', () => {
      const result = validateEggsCollectedIsReasonable(50, 0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no tiene gallinas vivas');
    });
  });

  describe('needsSanityCheckWarning', () => {
    it('should warn for production > 2x hen count', () => {
      expect(needsSanityCheckWarning(201, 100)).toBe(true);
      expect(needsSanityCheckWarning(300, 100)).toBe(true);
    });

    it('should not warn for production <= 2x hen count', () => {
      expect(needsSanityCheckWarning(200, 100)).toBe(false);
      expect(needsSanityCheckWarning(100, 100)).toBe(false);
      expect(needsSanityCheckWarning(80, 100)).toBe(false);
    });

    it('should not warn for zero hen count', () => {
      expect(needsSanityCheckWarning(100, 0)).toBe(false);
    });
  });

  describe('getSanityCheckWarningMessage', () => {
    it('should generate warning message with eggs per hen', () => {
      const message = getSanityCheckWarningMessage(250, 100);
      expect(message).toContain('⚠️');
      expect(message).toContain('250 huevos');
      expect(message).toContain('100 gallinas');
      expect(message).toContain('2.5 huevos/gallina');
    });
  });

  describe('isOptimalProduction', () => {
    it('should identify optimal production (80-95%)', () => {
      expect(isOptimalProduction(80, 100)).toBe(true); // 80%
      expect(isOptimalProduction(90, 100)).toBe(true); // 90%
      expect(isOptimalProduction(95, 100)).toBe(true); // 95%
    });

    it('should not flag low production', () => {
      expect(isOptimalProduction(69, 100)).toBe(false); // 69%
    });

    it('should not flag above-optimal production', () => {
      expect(isOptimalProduction(96, 100)).toBe(false); // 96%
      expect(isOptimalProduction(100, 100)).toBe(false); // 100%
    });

    it('should return false for zero hens', () => {
      expect(isOptimalProduction(80, 0)).toBe(false);
    });
  });

  describe('isLowProduction', () => {
    it('should identify low production (< 70%)', () => {
      expect(isLowProduction(69, 100)).toBe(true); // 69%
      expect(isLowProduction(50, 100)).toBe(true); // 50%
      expect(isLowProduction(30, 100)).toBe(true); // 30%
    });

    it('should not flag normal or optimal production', () => {
      expect(isLowProduction(70, 100)).toBe(false); // 70%
      expect(isLowProduction(80, 100)).toBe(false); // 80%
      expect(isLowProduction(100, 100)).toBe(false); // 100%
    });

    it('should return false for zero hens', () => {
      expect(isLowProduction(30, 0)).toBe(false);
    });
  });

  describe('getProductionStatus', () => {
    it('should return optimal status for 80-95% efficiency', () => {
      const status = getProductionStatus(85, 100);
      expect(status.status).toBe('optimal');
      expect(status.color).toBe('success');
      expect(status.message).toContain('85%');
      expect(status.message).toContain('óptima');
    });

    it('should return low status for < 70% efficiency', () => {
      const status = getProductionStatus(60, 100);
      expect(status.status).toBe('low');
      expect(status.color).toBe('warning');
      expect(status.message).toContain('60%');
      expect(status.message).toContain('baja');
    });

    it('should return normal status for 70-79% efficiency', () => {
      const status = getProductionStatus(75, 100);
      expect(status.status).toBe('normal');
      expect(status.color).toBe('default');
      expect(status.message).toContain('75%');
      expect(status.message).toContain('normal');
    });

    it('should return warning for unusually high production', () => {
      const status = getProductionStatus(250, 100);
      expect(status.status).toBe('warning');
      expect(status.color).toBe('warning');
      expect(status.message).toContain('250%');
      expect(status.message).toContain('inusualmente alta');
    });

    it('should return warning for zero hens', () => {
      const status = getProductionStatus(0, 0);
      expect(status.status).toBe('warning');
      expect(status.color).toBe('error');
      expect(status.message).toContain('sin gallinas vivas');
    });
  });
});
