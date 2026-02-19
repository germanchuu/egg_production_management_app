/**
 * Feeding Service Provider
 *
 * Provides factory method for FeedingService instantiation with proper
 * dependency injection.
 */

import { FeedingService } from './FeedingService';
import { RepositoryFactory } from '@/shared/database/repositories';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { getDatabase } from '@/shared/database';

/**
 * Feeding Service Provider
 */
export class FeedingServiceProvider {
  /**
   * Get FeedingService instance with all dependencies injected
   */
  static async getFeedingService(): Promise<FeedingService> {
    const db = getDatabase();
    const factory = new RepositoryFactory(db);

    const feedBatchRepository = factory.getFeedBatchRepository();
    const feedingRecordRepository = factory.getFeedingRecordRepository();
    const lotRepository = factory.getChickenLotRepository();
    const syncQueue = new SyncQueue(db);

    return new FeedingService(
      feedBatchRepository,
      feedingRecordRepository,
      lotRepository,
      syncQueue
    );
  }
}
