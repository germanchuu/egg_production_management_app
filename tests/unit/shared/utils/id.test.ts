/**
 * ID Generation Utility Tests
 *
 * Tests for UUID v4 generation.
 */

import { generateId } from '@/shared/utils/id';

describe('ID Generation', () => {
  describe('generateId', () => {
    it('should generate a valid UUID v4', () => {
      const id = generateId();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // where y is 8, 9, A, or B
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(id).toMatch(uuidV4Regex);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      const id3 = generateId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate IDs of correct length (36 characters with dashes)', () => {
      const id = generateId();
      expect(id.length).toBe(36);
    });

    it('should generate lowercase IDs', () => {
      const id = generateId();
      expect(id).toBe(id.toLowerCase());
    });

    it('should generate multiple unique IDs in a loop', () => {
      const ids = new Set<string>();
      const count = 100;

      for (let i = 0; i < count; i++) {
        ids.add(generateId());
      }

      // All IDs should be unique
      expect(ids.size).toBe(count);
    });
  });
});
