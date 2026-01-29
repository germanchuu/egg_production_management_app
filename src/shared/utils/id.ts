/**
 * ID Generation Utility
 *
 * Generates unique identifiers using UUID v4.
 *
 * Usage:
 * ```typescript
 * import { generateId } from '@/shared/utils/id';
 *
 * const userId = generateId(); // '123e4567-e89b-12d3-a456-426614174000'
 * const lotId = generateId();
 * ```
 */

/**
 * Generates a UUID v4 (universally unique identifier)
 *
 * Uses crypto.randomUUID() when available (Node.js, modern browsers),
 * falls back to a polyfill for React Native environments.
 *
 * @returns UUID v4 string in lowercase (36 characters including dashes)
 */
export function generateId(): string {
  // Check if crypto.randomUUID is available (Node.js 16+, modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Polyfill for React Native and older environments
  // Implementation based on RFC 4122 version 4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
