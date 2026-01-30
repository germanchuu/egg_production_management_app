/**
 * SyncQueue Tests
 *
 * Tests for the sync queue service that manages offline operations.
 */

import { SyncQueue } from '@/shared/sync/SyncQueue';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../../utils/testDatabase';
import * as SQLite from 'expo-sqlite';

describe('SyncQueue', () => {
  let db: SQLite.SQLiteDatabase;
  let syncQueue: SyncQueue;

  beforeEach(async () => {
    db = await createTestDatabase();
    syncQueue = new SyncQueue(db);
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
  });

  describe('enqueue', () => {
    it('should add a CREATE operation to the queue', async () => {
      const operation = {
        entityType: 'production_records',
        entityId: 'prod-123',
        operation: 'CREATE' as const,
      };

      await syncQueue.enqueue(operation);

      const pending = await syncQueue.getPending();
      expect(pending).toHaveLength(1);
      expect(pending[0].entity_type).toBe('production_records');
      expect(pending[0].entity_id).toBe('prod-123');
      expect(pending[0].operation).toBe('CREATE');
      expect(pending[0].synced_at).toBeNull();
    });

    it('should add an UPDATE operation to the queue', async () => {
      const operation = {
        entityType: 'chicken_lots',
        entityId: 'lot-123',
        operation: 'UPDATE' as const,
      };

      await syncQueue.enqueue(operation);

      const pending = await syncQueue.getPending();
      expect(pending).toHaveLength(1);
      expect(pending[0].operation).toBe('UPDATE');
    });

    it('should add a DELETE operation to the queue', async () => {
      const operation = {
        entityType: 'mortality_records',
        entityId: 'mort-123',
        operation: 'DELETE' as const,
      };

      await syncQueue.enqueue(operation);

      const pending = await syncQueue.getPending();
      expect(pending).toHaveLength(1);
      expect(pending[0].operation).toBe('DELETE');
    });

    it('should set synced_at to NULL by default', async () => {
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-123',
        operation: 'CREATE',
      });

      const pending = await syncQueue.getPending();
      expect(pending[0].synced_at).toBeNull();
    });

    it('should set local_timestamp automatically', async () => {
      const beforeEnqueue = new Date().toISOString();

      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-123',
        operation: 'CREATE',
      });

      const afterEnqueue = new Date().toISOString();
      const pending = await syncQueue.getPending();

      expect(pending[0].local_timestamp).toBeDefined();
      expect(pending[0].local_timestamp >= beforeEnqueue).toBe(true);
      expect(pending[0].local_timestamp <= afterEnqueue).toBe(true);
    });

    it('should set retry_count to 0 by default', async () => {
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-123',
        operation: 'CREATE',
      });

      const pending = await syncQueue.getPending();
      expect(pending[0].retry_count).toBe(0);
    });

    it('should generate a unique ID for each operation', async () => {
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-1',
        operation: 'CREATE',
      });

      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-2',
        operation: 'CREATE',
      });

      const pending = await syncQueue.getPending();
      expect(pending[0].id).toBeDefined();
      expect(pending[1].id).toBeDefined();
      expect(pending[0].id).not.toBe(pending[1].id);
    });
  });

  describe('getPending', () => {
    it('should return empty array when queue is empty', async () => {
      const pending = await syncQueue.getPending();
      expect(pending).toHaveLength(0);
    });

    it('should return all pending operations', async () => {
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-1',
        operation: 'CREATE',
      });

      await syncQueue.enqueue({
        entityType: 'mortality_records',
        entityId: 'mort-1',
        operation: 'CREATE',
      });

      const pending = await syncQueue.getPending();
      expect(pending).toHaveLength(2);
    });

    it('should not return synced operations', async () => {
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-1',
        operation: 'CREATE',
      });

      const pending1 = await syncQueue.getPending();
      const queueId = pending1[0].id;

      await syncQueue.markSynced(queueId);

      const pending2 = await syncQueue.getPending();
      expect(pending2).toHaveLength(0);
    });

    it('should return operations ordered by local_timestamp (FIFO)', async () => {
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-1',
        operation: 'CREATE',
      });

      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-2',
        operation: 'CREATE',
      });

      const pending = await syncQueue.getPending();
      expect(pending[0].entity_id).toBe('prod-1');
      expect(pending[1].entity_id).toBe('prod-2');
    });

    it('should accept optional limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await syncQueue.enqueue({
          entityType: 'production_records',
          entityId: `prod-${i}`,
          operation: 'CREATE',
        });
      }

      const pending = await syncQueue.getPending(5);
      expect(pending).toHaveLength(5);
    });
  });

  describe('markSynced', () => {
    it('should mark an operation as synced', async () => {
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-1',
        operation: 'CREATE',
      });

      const pending1 = await syncQueue.getPending();
      expect(pending1).toHaveLength(1);

      await syncQueue.markSynced(pending1[0].id);

      const pending2 = await syncQueue.getPending();
      expect(pending2).toHaveLength(0);
    });

    it('should update synced_at timestamp', async () => {
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-1',
        operation: 'CREATE',
      });

      const pending = await syncQueue.getPending();
      const queueId = pending[0].id;

      const beforeSync = new Date().toISOString();
      await syncQueue.markSynced(queueId);
      const afterSync = new Date().toISOString();

      const result = await db.getFirstAsync<{ synced_at: string }>(
        'SELECT synced_at FROM sync_queue WHERE id = ?',
        [queueId]
      );

      expect(result?.synced_at).toBeDefined();
      expect(result!.synced_at >= beforeSync).toBe(true);
      expect(result!.synced_at <= afterSync).toBe(true);
    });

    it('should not throw error for non-existent queue ID', async () => {
      await expect(
        syncQueue.markSynced('non-existent-id')
      ).resolves.not.toThrow();
    });
  });

  describe('getPendingCount', () => {
    it('should return 0 when queue is empty', async () => {
      const count = await syncQueue.getPendingCount();
      expect(count).toBe(0);
    });

    it('should return count of pending operations', async () => {
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-1',
        operation: 'CREATE',
      });

      await syncQueue.enqueue({
        entityType: 'mortality_records',
        entityId: 'mort-1',
        operation: 'CREATE',
      });

      const count = await syncQueue.getPendingCount();
      expect(count).toBe(2);
    });

    it('should not count synced operations', async () => {
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-1',
        operation: 'CREATE',
      });

      const pending = await syncQueue.getPending();
      await syncQueue.markSynced(pending[0].id);

      const count = await syncQueue.getPendingCount();
      expect(count).toBe(0);
    });
  });

  describe('clearSynced', () => {
    it('should remove synced operations from queue', async () => {
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-1',
        operation: 'CREATE',
      });

      const pending = await syncQueue.getPending();
      await syncQueue.markSynced(pending[0].id);

      await syncQueue.clearSynced();

      const allRecords = await db.getAllAsync('SELECT * FROM sync_queue');
      expect(allRecords).toHaveLength(0);
    });

    it('should not remove pending operations', async () => {
      await syncQueue.enqueue({
        entityType: 'production_records',
        entityId: 'prod-1',
        operation: 'CREATE',
      });

      await syncQueue.enqueue({
        entityType: 'mortality_records',
        entityId: 'mort-1',
        operation: 'CREATE',
      });

      const pending = await syncQueue.getPending();
      await syncQueue.markSynced(pending[0].id);

      await syncQueue.clearSynced();

      const remainingPending = await syncQueue.getPending();
      expect(remainingPending).toHaveLength(1);
      expect(remainingPending[0].entity_id).toBe('mort-1');
    });
  });
});
