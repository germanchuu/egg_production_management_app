/**
 * Production Service Provider
 *
 * Provides factory method for ProductionService instantiation with proper
 * dependency injection.
 */

import { ProductionService } from './ProductionService';
import { RepositoryFactory } from '@/shared/database/repositories';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { getDatabase } from '@/shared/database';

/**
 * Production Service Provider
 */
export class ProductionServiceProvider {
  /**
   * Get ProductionService instance with all dependencies injected
   */
  static async getProductionService(): Promise<ProductionService> {
    // Get database instance
    const db = getDatabase();

    // Create repository factory
    const factory = new RepositoryFactory(db);

    // Get repositories
    const productionRepository = factory.getProductionRecordRepository();
    const lotRepository = factory.getChickenLotRepository();

    // Create sync queue
    const syncQueue = new SyncQueue(db);

    // Create and return service with injected dependencies
    return new ProductionService(
      productionRepository,
      lotRepository,
      syncQueue
    );
  }
}
