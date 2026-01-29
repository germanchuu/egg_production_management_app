/**
 * Date Utilities
 *
 * Helper functions for date formatting, week calculations, and ISO-8601 conversions.
 *
 * Usage:
 * ```typescript
 * import { formatDate, calculateAgeWeeks } from '@/shared/utils/date';
 *
 * const today = formatDate(new Date()); // '2024-01-15'
 * const ageWeeks = calculateAgeWeeks('2024-01-01'); // Weeks since purchase
 * ```
 */

/**
 * Formats a Date object as YYYY-MM-DD
 *
 * @param date Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object as ISO-8601 datetime string
 *
 * @param date Date object to format
 * @returns ISO-8601 datetime string
 */
export function formatDateTime(date: Date): string {
  return date.toISOString();
}

/**
 * Converts ISO datetime string or YYYY-MM-DD to YYYY-MM-DD
 *
 * @param isoString ISO-8601 datetime or date string
 * @returns Date string in YYYY-MM-DD format
 */
export function toISODate(isoString: string): string {
  return isoString.split('T')[0];
}

/**
 * Converts Date object to ISO-8601 datetime string
 *
 * @param date Date object
 * @returns ISO-8601 datetime string
 */
export function toISODateTime(date: Date): string {
  return date.toISOString();
}

/**
 * Calculates age in weeks from a purchase date to today
 *
 * Used for calculating chicken lot age.
 *
 * @param purchaseDateStr Purchase date in YYYY-MM-DD format
 * @returns Age in weeks (rounded down)
 */
export function calculateAgeWeeks(purchaseDateStr: string): number {
  const purchaseDate = new Date(purchaseDateStr + 'T00:00:00Z');
  const today = new Date();

  const diffMs = today.getTime() - purchaseDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const diffWeeks = Math.floor(diffDays / 7);

  return diffWeeks;
}

/**
 * Adds weeks to a date
 *
 * @param dateStr Date string in YYYY-MM-DD format
 * @param weeks Number of weeks to add (negative to subtract)
 * @returns New date string in YYYY-MM-DD format
 */
export function addWeeks(dateStr: string, weeks: number): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return formatDate(date);
}

/**
 * Checks if a date string is today
 *
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns True if date is today
 */
export function isToday(dateStr: string): boolean {
  const today = formatDate(new Date());
  return dateStr === today;
}

/**
 * Checks if a date string is in the past (before today)
 *
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns True if date is in the past
 */
export function isPast(dateStr: string): boolean {
  const inputDate = new Date(dateStr + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return inputDate < today;
}

/**
 * Checks if a date string is in the future (after today)
 *
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns True if date is in the future
 */
export function isFuture(dateStr: string): boolean {
  const inputDate = new Date(dateStr + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(23, 59, 59, 999);

  return inputDate > today;
}
