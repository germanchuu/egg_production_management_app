/**
 * Validation Schemas Tests
 *
 * Tests for Zod validation schemas used throughout the app.
 */

import {
  dateSchema,
  positiveIntegerSchema,
  positiveDecimalSchema,
  uuidSchema,
  nonFutureDateSchema,
} from '@/shared/utils/validation';

describe('Validation Schemas', () => {
  describe('dateSchema', () => {
    it('should accept valid ISO-8601 date strings', () => {
      const result = dateSchema.safeParse('2024-01-15');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('2024-01-15');
      }
    });

    it('should accept valid ISO-8601 datetime strings', () => {
      const result = dateSchema.safeParse('2024-01-15T10:30:00Z');
      expect(result.success).toBe(true);
    });

    it('should reject invalid date formats', () => {
      expect(dateSchema.safeParse('15/01/2024').success).toBe(false);
      expect(dateSchema.safeParse('not-a-date').success).toBe(false);
      expect(dateSchema.safeParse('').success).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(dateSchema.safeParse(123).success).toBe(false);
      expect(dateSchema.safeParse(null).success).toBe(false);
      expect(dateSchema.safeParse(undefined).success).toBe(false);
    });
  });

  describe('nonFutureDateSchema', () => {
    it('should accept today\'s date', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = nonFutureDateSchema.safeParse(today);
      expect(result.success).toBe(true);
    });

    it('should accept past dates', () => {
      const result = nonFutureDateSchema.safeParse('2020-01-01');
      expect(result.success).toBe(true);
    });

    it('should reject future dates', () => {
      // Use a date definitely in the future (one year from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 365);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const result = nonFutureDateSchema.safeParse(futureDateStr);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('future');
      }
    });
  });

  describe('positiveIntegerSchema', () => {
    it('should accept positive integers', () => {
      expect(positiveIntegerSchema.safeParse(1).success).toBe(true);
      expect(positiveIntegerSchema.safeParse(100).success).toBe(true);
      expect(positiveIntegerSchema.safeParse(999999).success).toBe(true);
    });

    it('should reject zero', () => {
      const result = positiveIntegerSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('should reject negative integers', () => {
      expect(positiveIntegerSchema.safeParse(-1).success).toBe(false);
      expect(positiveIntegerSchema.safeParse(-100).success).toBe(false);
    });

    it('should reject decimals', () => {
      expect(positiveIntegerSchema.safeParse(1.5).success).toBe(false);
      expect(positiveIntegerSchema.safeParse(3.14).success).toBe(false);
    });

    it('should reject non-numbers', () => {
      expect(positiveIntegerSchema.safeParse('10').success).toBe(false);
      expect(positiveIntegerSchema.safeParse(null).success).toBe(false);
      expect(positiveIntegerSchema.safeParse(undefined).success).toBe(false);
    });
  });

  describe('positiveDecimalSchema', () => {
    it('should accept positive decimals', () => {
      expect(positiveDecimalSchema.safeParse(1.5).success).toBe(true);
      expect(positiveDecimalSchema.safeParse(3.14).success).toBe(true);
      expect(positiveDecimalSchema.safeParse(0.01).success).toBe(true);
    });

    it('should accept positive integers', () => {
      expect(positiveDecimalSchema.safeParse(1).success).toBe(true);
      expect(positiveDecimalSchema.safeParse(100).success).toBe(true);
    });

    it('should reject zero', () => {
      const result = positiveDecimalSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('should reject negative numbers', () => {
      expect(positiveDecimalSchema.safeParse(-1.5).success).toBe(false);
      expect(positiveDecimalSchema.safeParse(-0.01).success).toBe(false);
    });

    it('should reject non-numbers', () => {
      expect(positiveDecimalSchema.safeParse('3.14').success).toBe(false);
      expect(positiveDecimalSchema.safeParse(null).success).toBe(false);
    });
  });

  describe('uuidSchema', () => {
    it('should accept valid UUIDs v4', () => {
      expect(
        uuidSchema.safeParse('123e4567-e89b-12d3-a456-426614174000').success
      ).toBe(true);
      expect(
        uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success
      ).toBe(true);
    });

    it('should accept UUIDs with uppercase letters', () => {
      expect(
        uuidSchema.safeParse('550E8400-E29B-41D4-A716-446655440000').success
      ).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
      expect(uuidSchema.safeParse('123-456-789').success).toBe(false);
      expect(
        uuidSchema.safeParse('123e4567-e89b-12d3-a456-42661417400').success
      ).toBe(false); // Too short
      expect(
        uuidSchema.safeParse('123e4567-e89b-12d3-a456-4266141740000').success
      ).toBe(false); // Too long
    });

    it('should reject empty strings', () => {
      expect(uuidSchema.safeParse('').success).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(uuidSchema.safeParse(123).success).toBe(false);
      expect(uuidSchema.safeParse(null).success).toBe(false);
    });
  });
});
