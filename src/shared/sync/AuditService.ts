/**
 * Audit Service
 *
 * Handles local audit logging for critical operations.
 * Tracks who did what, when, and from which device.
 *
 * Key responsibilities:
 * - Log critical operations (user creation, invitation acceptance, lot operations, high mortality)
 * - Delegate SQL operations to AuditLogRepository
 * - Enqueue audit logs for sync to Firestore
 * - Support querying audit history
 *
 * Critical operations that require audit logging:
 * - User creation (new invitation acceptance)
 * - Invitation generation and acceptance
 * - Chicken lot creation and deletion
 * - Mortality records with >10% mortality rate
 *
 * Architecture:
 * - Uses Dependency Injection (Repository + SyncQueue)
 * - Follows Constitution VI: Data Sync Architecture Pattern
 * - Returns ServiceResult<T> for consistent error handling
 */

import { AuditLogEntry, SyncOperation } from '@/shared/types/entities';
import {
  AuditLogRepository,
  AuditLogQueryOptions,
  CreateAuditLogData,
} from '@/shared/database/repositories/AuditLogRepository';
import { SyncQueue } from './SyncQueue';
import { AuthService } from '@/features/auth/services/AuthService';

/**
 * Service result type
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Audit log creation input
 */
export interface CreateAuditLogInput {
  entityType: string;
  entityId: string;
  operationType: SyncOperation;
  userId: string;
}

/**
 * Audit Service
 */
export class AuditService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly syncQueue: SyncQueue
  ) {}

  /**
   * Log a critical operation to local audit log
   *
   * @param input - Audit log creation input
   * @returns Service result with created audit log entry
   */
  async logOperation(
    input: CreateAuditLogInput
  ): Promise<ServiceResult<AuditLogEntry>> {
    try {
      // Generate ID and timestamp
      const id = this.generateUUID();
      const timestamp = new Date().toISOString();

      // Get device ID
      const deviceId = (await AuthService.getDeviceId()) || 'unknown';

      // Create audit log data
      const auditData: CreateAuditLogData = {
        id,
        entityType: input.entityType,
        entityId: input.entityId,
        operationType: input.operationType,
        timestamp,
        userId: input.userId,
        deviceId,
        synced: false,
      };

      // Create audit log entry via repository
      const auditEntry = await this.auditLogRepository.create(auditData);

      // Enqueue for sync to Firestore
      await this.syncQueue.enqueue({
        entityType: 'audit_logs', // Plural for Firestore collection
        entityId: auditEntry.id,
        operation: SyncOperation.Create,
      });

      return {
        success: true,
        data: auditEntry,
      };
    } catch (error) {
      console.error('Error logging audit operation:', error);
      return {
        success: false,
        error: 'Error al registrar la operación de auditoría',
      };
    }
  }

  /**
   * Log user creation (invitation acceptance)
   *
   * @param userId - ID of created user
   * @param createdBy - ID of user who created the invitation
   * @returns Service result with audit log entry
   */
  async logUserCreation(
    userId: string,
    createdBy: string
  ): Promise<ServiceResult<AuditLogEntry>> {
    return this.logOperation({
      entityType: 'User',
      entityId: userId,
      operationType: SyncOperation.Create,
      userId: createdBy,
    });
  }

  /**
   * Log invitation acceptance
   *
   * @param invitationId - ID of accepted invitation
   * @param userId - ID of user who accepted
   * @returns Service result with audit log entry
   */
  async logInvitationAcceptance(
    invitationId: string,
    userId: string
  ): Promise<ServiceResult<AuditLogEntry>> {
    return this.logOperation({
      entityType: 'Invitation',
      entityId: invitationId,
      operationType: SyncOperation.Update,
      userId,
    });
  }

  /**
   * Log chicken lot creation
   *
   * @param lotId - ID of created lot
   * @param userId - ID of user who created the lot
   * @returns Service result with audit log entry
   */
  async logLotCreation(
    lotId: string,
    userId: string
  ): Promise<ServiceResult<AuditLogEntry>> {
    return this.logOperation({
      entityType: 'ChickenLot',
      entityId: lotId,
      operationType: SyncOperation.Create,
      userId,
    });
  }

  /**
   * Log chicken lot deletion
   *
   * @param lotId - ID of deleted lot
   * @param userId - ID of user who deleted the lot
   * @returns Service result with audit log entry
   */
  async logLotDeletion(
    lotId: string,
    userId: string
  ): Promise<ServiceResult<AuditLogEntry>> {
    return this.logOperation({
      entityType: 'ChickenLot',
      entityId: lotId,
      operationType: SyncOperation.Delete,
      userId,
    });
  }

  /**
   * Log high mortality event (>10% mortality rate)
   *
   * @param mortalityRecordId - ID of mortality record
   * @param userId - ID of user who recorded mortality
   * @returns Service result with audit log entry
   */
  async logHighMortality(
    mortalityRecordId: string,
    userId: string
  ): Promise<ServiceResult<AuditLogEntry>> {
    return this.logOperation({
      entityType: 'MortalityRecord',
      entityId: mortalityRecordId,
      operationType: SyncOperation.Create,
      userId,
    });
  }

  /**
   * Query audit log entries
   *
   * @param options - Query filter options
   * @returns Service result with entries and total count
   */
  async queryAuditLog(options: AuditLogQueryOptions = {}): Promise<
    ServiceResult<{
      entries: AuditLogEntry[];
      total: number;
    }>
  > {
    try {
      const result = await this.auditLogRepository.query(options);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error querying audit log:', error);
      return {
        success: false,
        error: 'Error al consultar el registro de auditoría',
      };
    }
  }

  /**
   * Get audit log entries for a specific entity
   *
   * @param entityType - Type of entity
   * @param entityId - ID of entity
   * @returns Service result with audit log entries
   */
  async getEntityAuditLog(
    entityType: string,
    entityId: string
  ): Promise<ServiceResult<AuditLogEntry[]>> {
    try {
      const entries = await this.auditLogRepository.findByEntity(
        entityType,
        entityId
      );

      return {
        success: true,
        data: entries,
      };
    } catch (error) {
      console.error('Error getting entity audit log:', error);
      return {
        success: false,
        error: 'Error al obtener el registro de auditoría de la entidad',
      };
    }
  }

  /**
   * Get pending audit log entries (not yet synced)
   *
   * @param limit - Maximum number of entries to retrieve
   * @returns Service result with pending audit log entries
   */
  async getPendingAuditLogs(
    limit: number = 100
  ): Promise<ServiceResult<AuditLogEntry[]>> {
    try {
      const entries = await this.auditLogRepository.findPending(limit);

      return {
        success: true,
        data: entries,
      };
    } catch (error) {
      console.error('Error getting pending audit logs:', error);
      return {
        success: false,
        error: 'Error al obtener los registros de auditoría pendientes',
      };
    }
  }

  /**
   * Mark audit log entry as synced
   *
   * @param auditLogId - ID of audit log entry
   * @returns Service result
   */
  async markAsSynced(auditLogId: string): Promise<ServiceResult<void>> {
    try {
      await this.auditLogRepository.markAsSynced(auditLogId);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error marking audit log as synced:', error);
      return {
        success: false,
        error: 'Error al marcar el registro de auditoría como sincronizado',
      };
    }
  }

  /**
   * Mark multiple audit log entries as synced
   *
   * @param auditLogIds - Array of audit log IDs
   * @returns Service result
   */
  async markMultipleAsSynced(auditLogIds: string[]): Promise<ServiceResult<void>> {
    try {
      await this.auditLogRepository.markMultipleAsSynced(auditLogIds);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error marking multiple audit logs as synced:', error);
      return {
        success: false,
        error:
          'Error al marcar múltiples registros de auditoría como sincronizados',
      };
    }
  }

  /**
   * Generate UUID v4
   * Simple implementation for audit log ID generation
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
