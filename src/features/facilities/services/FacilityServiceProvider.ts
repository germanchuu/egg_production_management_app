/**
 * Facility Service Provider
 *
 * Provides factory method for FacilityService instantiation with proper
 * dependency injection. Handles all dependency wiring.
 */

import { FacilityService } from './FacilityService';
import { RepositoryFactory } from '@/shared/database/repositories';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { getDatabase } from '@/shared/database';

/**
 * Facility Service Provider
 */
export class FacilityServiceProvider {
  /**
   * Get FacilityService instance with all dependencies injected
   */
  static async getFacilityService(): Promise<FacilityService> {
    // Get database instance
    const db = await getDatabase();

    // Create repository factory
    const factory = new RepositoryFactory(db);

    // Get repositories
    const houseRepository = factory.getChickenHouseRepository();
    const lotRepository = factory.getChickenLotRepository();

    // Create sync queue
    const syncQueue = new SyncQueue(db);

    // Create and return service with injected dependencies
    return new FacilityService(houseRepository, lotRepository, syncQueue);
  }
}
