/**
 * AuditLog Repository
 *
 * Handles all database operations for audit log entries.
 * Implements IRepository interface for standardized data access.
 *
 * Responsibilities:
 * - Execute all SQL operations for audit logs
 * - Return domain entities (using AuditLogMapper)
 * - Provide query methods for audit history
 * - Support sync operations (getPending, markAsSynced)
 */

import { SQLiteDatabase } from 'expo-sqlite';
import { IRepository } from './IRepository';
import { AuditLogEntry, SyncOperation } from '@/shared/types/entities';
import {
  AuditLogMapper,
  AuditLogDbRecord,
} from '@/shared/sync/mappers/AuditLogMapper';

/**
 * Create audit log data
 */
export interface CreateAuditLogData {
  id: string;
  entityType: string;
  entityId: string;
  operationType: SyncOperation;
  timestamp: string;
  userId: string;
  deviceId: string;
  synced?: boolean;
}

/**
 * Update audit log data (only synced flag can be updated)
 */
export interface UpdateAuditLogData {
  synced: boolean;
}

/**
 * Audit log query options
 */
export interface AuditLogQueryOptions {
  entityType?: string;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * AuditLog Repository
 */
export class AuditLogRepository
  implements IRepository<AuditLogEntry, CreateAuditLogData, UpdateAuditLogData>
{
  constructor(private readonly db: SQLiteDatabase) {}

  /**
   * Find audit log entry by ID
   */
  async findById(id: string): Promise<AuditLogEntry | null> {
    try {
      const result = await this.db.getFirstAsync<AuditLogDbRecord>(
        'SELECT * FROM audit_log_local WHERE id = ?',
        [id]
      );

      if (!result) {
        return null;
      }

      return AuditLogMapper.toDomain(result);
    } catch (error) {
      console.error('Error finding audit log by ID:', error);
      throw error;
    }
  }

  /**
   * Find all audit log entries
   */
  async findAll(): Promise<AuditLogEntry[]> {
    try {
      const results = await this.db.getAllAsync<AuditLogDbRecord>(
        'SELECT * FROM audit_log_local ORDER BY timestamp DESC'
      );

      return AuditLogMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding all audit logs:', error);
      throw error;
    }
  }

  /**
   * Create a new audit log entry
   */
  async create(data: CreateAuditLogData): Promise<AuditLogEntry> {
    try {
      await this.db.runAsync(
        `INSERT INTO audit_log_local (
          id, entity_type, entity_id, operation_type,
          timestamp, user_id, device_id, synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.entityType,
          data.entityId,
          data.operationType,
          data.timestamp,
          data.userId,
          data.deviceId,
          data.synced ? 1 : 0,
        ]
      );

      // Return the created entity
      const created = await this.findById(data.id);
      if (!created) {
        throw new Error('Failed to retrieve created audit log');
      }

      return created;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Update audit log entry (only synced flag)
   */
  async update(id: string, data: UpdateAuditLogData): Promise<AuditLogEntry> {
    try {
      await this.db.runAsync(
        'UPDATE audit_log_local SET synced = ? WHERE id = ?',
        [data.synced ? 1 : 0, id]
      );

      // Return the updated entity
      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated audit log');
      }

      return updated;
    } catch (error) {
      console.error('Error updating audit log:', error);
      throw error;
    }
  }

  /**
   * Delete audit log entry by ID
   * (Note: Audit logs should rarely be deleted)
   */
  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM audit_log_local WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting audit log:', error);
      throw error;
    }
  }

  /**
   * Check if audit log entry exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM audit_log_local WHERE id = ?',
        [id]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking audit log existence:', error);
      throw error;
    }
  }

  /**
   * Query audit logs with filters
   */
  async query(options: AuditLogQueryOptions): Promise<{
    entries: AuditLogEntry[];
    total: number;
  }> {
    try {
      // Build WHERE clause
      const whereClauses: string[] = [];
      const params: any[] = [];

      if (options.entityType) {
        whereClauses.push('entity_type = ?');
        params.push(options.entityType);
      }

      if (options.entityId) {
        whereClauses.push('entity_id = ?');
        params.push(options.entityId);
      }

      if (options.userId) {
        whereClauses.push('user_id = ?');
        params.push(options.userId);
      }

      if (options.startDate) {
        whereClauses.push('timestamp >= ?');
        params.push(options.startDate);
      }

      if (options.endDate) {
        whereClauses.push('timestamp <= ?');
        params.push(options.endDate);
      }

      const whereClause =
        whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Get total count
      const countResult = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM audit_log_local ${whereClause}`,
        params
      );
      const total = countResult?.count || 0;

      // Get entries with pagination
      const limit = options.limit || 100;
      const offset = options.offset || 0;

      const results = await this.db.getAllAsync<AuditLogDbRecord>(
        `SELECT * FROM audit_log_local ${whereClause}
         ORDER BY timestamp DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const entries = AuditLogMapper.toDomainList(results);

      return { entries, total };
    } catch (error) {
      console.error('Error querying audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  async findByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
    try {
      const results = await this.db.getAllAsync<AuditLogDbRecord>(
        `SELECT * FROM audit_log_local
         WHERE entity_type = ? AND entity_id = ?
         ORDER BY timestamp DESC`,
        [entityType, entityId]
      );

      return AuditLogMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding audit logs by entity:', error);
      throw error;
    }
  }

  /**
   * Get pending audit logs (not yet synced)
   */
  async findPending(limit: number = 100): Promise<AuditLogEntry[]> {
    try {
      const results = await this.db.getAllAsync<AuditLogDbRecord>(
        `SELECT * FROM audit_log_local
         WHERE synced = 0
         ORDER BY timestamp ASC
         LIMIT ?`,
        [limit]
      );

      return AuditLogMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding pending audit logs:', error);
      throw error;
    }
  }

  /**
   * Mark audit log as synced
   */
  async markAsSynced(id: string): Promise<void> {
    try {
      await this.db.runAsync(
        'UPDATE audit_log_local SET synced = 1 WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error marking audit log as synced:', error);
      throw error;
    }
  }

  /**
   * Mark multiple audit logs as synced
   */
  async markMultipleAsSynced(ids: string[]): Promise<void> {
    try {
      if (ids.length === 0) return;

      const placeholders = ids.map(() => '?').join(',');
      await this.db.runAsync(
        `UPDATE audit_log_local SET synced = 1 WHERE id IN (${placeholders})`,
        ids
      );
    } catch (error) {
      console.error('Error marking multiple audit logs as synced:', error);
      throw error;
    }
  }

  /**
   * Get audit log count by entity type
   */
  async countByEntityType(entityType: string): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM audit_log_local WHERE entity_type = ?',
        [entityType]
      );

      return result?.count || 0;
    } catch (error) {
      console.error('Error counting audit logs by entity type:', error);
      throw error;
    }
  }
}
