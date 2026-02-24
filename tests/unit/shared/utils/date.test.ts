/**
 * Date Utilities Tests
 *
 * Tests for date formatting and calculations.
 */

import {
  formatDate,
  formatDateTime,
  toISODate,
  toISODateTime,
  calculateAgeWeeks,
  addWeeks,
  isToday,
  isPast,
  isFuture,
} from '@/shared/utils/date';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should format date object with correct padding', () => {
      const date = new Date('2024-03-05T00:00:00Z');
      expect(formatDate(date)).toBe('2024-03-05');
    });
  });

  describe('formatDateTime', () => {
    it('should format datetime in ISO-8601 format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDateTime(date);
      expect(formatted).toContain('2024-01-15');
      expect(formatted).toContain('T');
    });
  });

  describe('toISODate', () => {
    it('should convert ISO string to YYYY-MM-DD', () => {
      expect(toISODate('2024-01-15T10:30:00Z')).toBe('2024-01-15');
      expect(toISODate('2024-03-05T23:59:59Z')).toBe('2024-03-05');
    });

    it('should handle dates already in YYYY-MM-DD format', () => {
      expect(toISODate('2024-01-15')).toBe('2024-01-15');
    });
  });

  describe('toISODateTime', () => {
    it('should convert Date to ISO-8601 datetime', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const result = toISODateTime(date);
      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });
  });

  describe('calculateAgeWeeks', () => {
    it('should calculate age in weeks from purchase date', () => {
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - 14); // 2 weeks ago
      const purchaseDateStr = toISODate(purchaseDate.toISOString());

      const ageWeeks = calculateAgeWeeks(purchaseDateStr);
      expect(ageWeeks).toBe(2);
    });

    it('should return 0 for purchase date today', () => {
      const today = toISODate(new Date().toISOString());
      expect(calculateAgeWeeks(today)).toBe(0);
    });

    it('should calculate age for past dates correctly', () => {
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - 35); // 5 weeks ago
      const purchaseDateStr = toISODate(purchaseDate.toISOString());

      const ageWeeks = calculateAgeWeeks(purchaseDateStr);
      expect(ageWeeks).toBe(5);
    });
  });

  describe('addWeeks', () => {
    it('should add weeks to a date', () => {
      const result = addWeeks('2024-01-01', 2);
      expect(result).toBe('2024-01-15');
    });

    it('should subtract weeks with negative number', () => {
      const result = addWeeks('2024-01-15', -2);
      expect(result).toBe('2024-01-01');
    });

    it('should handle zero weeks', () => {
      const result = addWeeks('2024-01-15', 0);
      expect(result).toBe('2024-01-15');
    });
  });

  describe('isToday', () => {
    it('should return true for today\'s date', () => {
      const today = toISODate(new Date().toISOString());
      expect(isToday(today)).toBe(true);
    });

    it('should return false for past dates', () => {
      expect(isToday('2020-01-01')).toBe(false);
    });

    it('should return false for future dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      const futureStr = toISODate(future.toISOString());
      expect(isToday(futureStr)).toBe(false);
    });
  });

  describe('isPast', () => {
    it('should return true for past dates', () => {
      expect(isPast('2020-01-01')).toBe(true);
    });

    it('should return false for today', () => {
      const today = toISODate(new Date().toISOString());
      expect(isPast(today)).toBe(false);
    });

    it('should return false for future dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      const futureStr = toISODate(future.toISOString());
      expect(isPast(futureStr)).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('should return true for future dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      const futureStr = toISODate(future.toISOString());
      expect(isFuture(futureStr)).toBe(true);
    });

    it('should return false for today', () => {
      const today = toISODate(new Date().toISOString());
      expect(isFuture(today)).toBe(false);
    });

    it('should return false for past dates', () => {
      expect(isFuture('2020-01-01')).toBe(false);
    });
  });
});
