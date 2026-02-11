/**
 * Mortality Service Provider
 *
 * Provides factory method for MortalityService instantiation with proper
 * dependency injection. Handles all dependency wiring including AuditService.
 */

import { MortalityService } from './MortalityService';
import { RepositoryFactory } from '@/shared/database/repositories';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { AuditServiceProvider } from '@/shared/sync/AuditServiceProvider';
import { getDatabase } from '@/shared/database';

/**
 * Mortality Service Provider
 */
export class MortalityServiceProvider {
  /**
   * Get MortalityService instance with all dependencies injected
   */
  static async getMortalityService(): Promise<MortalityService> {
    // Get database instance
    const db = getDatabase();

    // Create repository factory
    const factory = new RepositoryFactory(db);

    // Get repositories
    const mortalityRepository = factory.getMortalityRecordRepository();
    const lotRepository = factory.getChickenLotRepository();

    // Create sync queue
    const syncQueue = new SyncQueue(db);

    // Get audit service
    const auditService = await AuditServiceProvider.getAuditService();

    // Create and return service with injected dependencies
    return new MortalityService(
      db,
      mortalityRepository,
      lotRepository,
      syncQueue,
      auditService
    );
  }
}
