/**
 * Validation Schemas
 *
 * Zod schemas for data validation throughout the app.
 *
 * Usage:
 * ```typescript
 * import { dateSchema, positiveIntegerSchema } from '@/shared/utils/validation';
 *
 * // Validate input
 * const result = dateSchema.safeParse(userInput);
 * if (result.success) {
 *   console.log('Valid date:', result.data);
 * } else {
 *   console.error('Validation errors:', result.error.errors);
 * }
 * ```
 */

import { z } from 'zod';

/**
 * Date schema - accepts ISO-8601 date/datetime strings
 *
 * Examples: '2024-01-15', '2024-01-15T10:30:00Z'
 */
export const dateSchema = z.string().datetime({ offset: true }).or(
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
);

/**
 * Non-future date schema - accepts ISO-8601 dates but rejects future dates
 *
 * Used for preventing users from entering future dates (e.g., production records)
 */
export const nonFutureDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
  .refine(
    (dateStr) => {
      const inputDate = new Date(dateStr);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return inputDate <= today;
    },
    {
      message: 'Date cannot be in the future',
    }
  );

/**
 * Positive integer schema - accepts integers > 0
 *
 * Used for counts (eggs collected, hens died, etc.)
 */
export const positiveIntegerSchema = z
  .number()
  .int('Must be a whole number')
  .positive('Must be greater than 0');

/**
 * Positive decimal schema - accepts numbers > 0 (including decimals)
 *
 * Used for quantities (feed kg, mortality rate, etc.)
 */
export const positiveDecimalSchema = z
  .number()
  .positive('Must be greater than 0');

/**
 * UUID schema - validates UUID v4 format
 *
 * Used for entity IDs throughout the app
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * Display name schema - validates user display names
 *
 * Used for user creation and editing
 */
export const displayNameSchema = z
  .string()
  .min(1, 'El nombre es obligatorio')
  .min(3, 'El nombre debe tener al menos 3 caracteres')
  .max(100, 'El nombre no puede exceder 100 caracteres')
  .trim();
