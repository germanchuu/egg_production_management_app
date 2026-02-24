/**
 * ConflictResolver Tests
 *
 * Tests for the Last-Write-Wins (LWW) conflict resolution strategy.
 */

import { ConflictResolver } from '@/shared/sync/ConflictResolver';

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
  });

  describe('resolve', () => {
    it('should return remote when remote timestamp is newer', () => {
      const local = {
        id: 'record-1',
        updatedAt: '2024-01-01T10:00:00.000Z',
        data: 'local data',
      };

      const remote = {
        id: 'record-1',
        updatedAt: '2024-01-01T11:00:00.000Z',
        data: 'remote data',
      };

      const result = resolver.resolve(local, remote);

      expect(result.winner).toBe('remote');
      expect(result.document).toEqual(remote);
    });

    it('should return local when local timestamp is newer', () => {
      const local = {
        id: 'record-1',
        updatedAt: '2024-01-01T12:00:00.000Z',
        data: 'local data',
      };

      const remote = {
        id: 'record-1',
        updatedAt: '2024-01-01T11:00:00.000Z',
        data: 'remote data',
      };

      const result = resolver.resolve(local, remote);

      expect(result.winner).toBe('local');
      expect(result.document).toEqual(local);
    });

    it('should return remote when timestamps are equal (tie-breaker)', () => {
      const local = {
        id: 'record-1',
        updatedAt: '2024-01-01T10:00:00.000Z',
        data: 'local data',
      };

      const remote = {
        id: 'record-1',
        updatedAt: '2024-01-01T10:00:00.000Z',
        data: 'remote data',
      };

      const result = resolver.resolve(local, remote);

      expect(result.winner).toBe('remote');
      expect(result.document).toEqual(remote);
    });

    it('should handle millisecond precision differences', () => {
      const local = {
        id: 'record-1',
        updatedAt: '2024-01-01T10:00:00.123Z',
        data: 'local data',
      };

      const remote = {
        id: 'record-1',
        updatedAt: '2024-01-01T10:00:00.124Z',
        data: 'remote data',
      };

      const result = resolver.resolve(local, remote);

      expect(result.winner).toBe('remote');
      expect(result.document).toEqual(remote);
    });

    it('should work with production records', () => {
      const local = {
        id: 'prod-123',
        lotId: 'lot-1',
        date: '2024-01-01',
        goodEggs: 100,
        damagedEggs: 5,
        updatedAt: '2024-01-01T10:00:00.000Z',
      };

      const remote = {
        id: 'prod-123',
        lotId: 'lot-1',
        date: '2024-01-01',
        goodEggs: 102,
        damagedEggs: 3,
        updatedAt: '2024-01-01T11:00:00.000Z',
      };

      const result = resolver.resolve(local, remote);

      expect(result.winner).toBe('remote');
      expect(result.document.goodEggs).toBe(102);
      expect(result.document.damagedEggs).toBe(3);
    });

    it('should work with mortality records', () => {
      const local = {
        id: 'mort-123',
        lotId: 'lot-1',
        date: '2024-01-01',
        count: 5,
        updatedAt: '2024-01-01T10:00:00.000Z',
      };

      const remote = {
        id: 'mort-123',
        lotId: 'lot-1',
        date: '2024-01-01',
        count: 6,
        updatedAt: '2024-01-01T09:00:00.000Z',
      };

      const result = resolver.resolve(local, remote);

      expect(result.winner).toBe('local');
      expect(result.document.count).toBe(5);
    });

    it('should handle different date formats (all ISO-8601)', () => {
      const local = {
        id: 'record-1',
        updatedAt: '2024-01-01T10:00:00Z', // No milliseconds
        data: 'local',
      };

      const remote = {
        id: 'record-1',
        updatedAt: '2024-01-01T10:00:01.000Z', // With milliseconds
        data: 'remote',
      };

      const result = resolver.resolve(local, remote);

      expect(result.winner).toBe('remote');
    });

    it('should preserve all fields from winning document', () => {
      const local = {
        id: 'house-1',
        name: 'House A',
        capacity: 1000,
        isActive: true,
        createdAt: '2024-01-01T09:00:00.000Z',
        updatedAt: '2024-01-01T10:00:00.000Z',
        metadata: { custom: 'field' },
      };

      const remote = {
        id: 'house-1',
        name: 'House A Updated',
        capacity: 1200,
        isActive: false,
        createdAt: '2024-01-01T09:00:00.000Z',
        updatedAt: '2024-01-01T11:00:00.000Z',
        metadata: { custom: 'updated' },
      };

      const result = resolver.resolve(local, remote);

      expect(result.winner).toBe('remote');
      expect(result.document).toEqual(remote);
      expect(result.document.metadata).toEqual({ custom: 'updated' });
    });

    it('should throw error if local document missing updatedAt', () => {
      const local = {
        id: 'record-1',
        data: 'local data',
      };

      const remote = {
        id: 'record-1',
        updatedAt: '2024-01-01T10:00:00.000Z',
        data: 'remote data',
      };

      expect(() => resolver.resolve(local as any, remote)).toThrow(
        'Both documents must have updatedAt timestamps'
      );
    });

    it('should throw error if remote document missing updatedAt', () => {
      const local = {
        id: 'record-1',
        updatedAt: '2024-01-01T10:00:00.000Z',
        data: 'local data',
      };

      const remote = {
        id: 'record-1',
        data: 'remote data',
      };

      expect(() => resolver.resolve(local, remote as any)).toThrow(
        'Both documents must have updatedAt timestamps'
      );
    });

    it('should throw error if both documents missing updatedAt', () => {
      const local = {
        id: 'record-1',
        data: 'local data',
      };

      const remote = {
        id: 'record-1',
        data: 'remote data',
      };

      expect(() => resolver.resolve(local as any, remote as any)).toThrow(
        'Both documents must have updatedAt timestamps'
      );
    });

    it('should handle invalid timestamp format', () => {
      const local = {
        id: 'record-1',
        updatedAt: 'invalid-timestamp',
        data: 'local data',
      };

      const remote = {
        id: 'record-1',
        updatedAt: '2024-01-01T10:00:00.000Z',
        data: 'remote data',
      };

      expect(() => resolver.resolve(local, remote)).toThrow(
        'Invalid timestamp format'
      );
    });
  });

  describe('batchResolve', () => {
    it('should resolve multiple conflicts', () => {
      const conflicts = [
        {
          local: {
            id: 'record-1',
            updatedAt: '2024-01-01T10:00:00.000Z',
            data: 'local 1',
          },
          remote: {
            id: 'record-1',
            updatedAt: '2024-01-01T11:00:00.000Z',
            data: 'remote 1',
          },
        },
        {
          local: {
            id: 'record-2',
            updatedAt: '2024-01-01T12:00:00.000Z',
            data: 'local 2',
          },
          remote: {
            id: 'record-2',
            updatedAt: '2024-01-01T11:00:00.000Z',
            data: 'remote 2',
          },
        },
      ];

      const results = resolver.batchResolve(conflicts);

      expect(results).toHaveLength(2);
      expect(results[0].winner).toBe('remote');
      expect(results[0].document.data).toBe('remote 1');
      expect(results[1].winner).toBe('local');
      expect(results[1].document.data).toBe('local 2');
    });

    it('should handle empty batch', () => {
      const results = resolver.batchResolve([]);
      expect(results).toHaveLength(0);
    });

    it('should stop on first error in batch', () => {
      const conflicts = [
        {
          local: {
            id: 'record-1',
            updatedAt: '2024-01-01T10:00:00.000Z',
            data: 'local 1',
          },
          remote: {
            id: 'record-1',
            updatedAt: '2024-01-01T11:00:00.000Z',
            data: 'remote 1',
          },
        },
        {
          local: {
            id: 'record-2',
            data: 'local 2',
          },
          remote: {
            id: 'record-2',
            updatedAt: '2024-01-01T11:00:00.000Z',
            data: 'remote 2',
          },
        },
      ];

      expect(() => resolver.batchResolve(conflicts as any)).toThrow(
        'Both documents must have updatedAt timestamps'
      );
    });
  });
});
