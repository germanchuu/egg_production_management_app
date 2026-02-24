/**
 * Audit Service Provider
 *
 * Provides factory method for AuditService instantiation with proper dependency injection.
 * Handles all dependency wiring (Repository + SyncQueue).
 *
 * Usage:
 * ```typescript
 * const auditService = await AuditServiceProvider.getAuditService();
 * await auditService.logUserCreation(userId, createdBy);
 * ```
 */

import { AuditService } from './AuditService';
import { AuditLogRepository } from '@/shared/database/repositories/AuditLogRepository';
import { SyncQueue } from './SyncQueue';
import { getDatabase } from '@/shared/database';

/**
 * Audit Service Provider
 */
export class AuditServiceProvider {
  /**
   * Get AuditService instance with all dependencies injected
   *
   * @returns Configured AuditService instance
   */
  static async getAuditService(): Promise<AuditService> {
    // Get database instance
    const db = await getDatabase();

    // Create repository
    const auditLogRepository = new AuditLogRepository(db);

    // Create sync queue
    const syncQueue = new SyncQueue(db);

    // Create and return service with injected dependencies
    return new AuditService(auditLogRepository, syncQueue);
  }
}
