/**
 * AuditLog Mapper
 *
 * Centralizes transformations between database records (snake_case)
 * and domain entities (camelCase) for audit log entries.
 *
 * Responsibilities:
 * - Transform DB records to domain entities (toDomain)
 * - Transform domain entities to DB records (toPersistence)
 * - Handle synced field conversion (boolean ↔ INTEGER)
 */

import { AuditLogEntry, SyncOperation } from '@/shared/types/entities';

/**
 * Database record type (snake_case)
 */
export interface AuditLogDbRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  operation_type: string;
  timestamp: string;
  user_id: string;
  device_id: string;
  synced: number; // SQLite INTEGER (0=false, 1=true)
}

/**
 * AuditLog Mapper
 */
export class AuditLogMapper {
  /**
   * Transform database record to domain entity
   *
   * @param dbRecord - Database record (snake_case)
   * @returns Domain entity (camelCase)
   */
  static toDomain(dbRecord: AuditLogDbRecord): AuditLogEntry {
    return {
      id: dbRecord.id,
      entityType: dbRecord.entity_type,
      entityId: dbRecord.entity_id,
      operationType: dbRecord.operation_type as SyncOperation,
      timestamp: dbRecord.timestamp,
      userId: dbRecord.user_id,
      deviceId: dbRecord.device_id,
      synced: Boolean(dbRecord.synced),
    };
  }

  /**
   * Transform domain entity to database record
   *
   * @param entity - Domain entity (camelCase)
   * @returns Database record (snake_case)
   */
  static toPersistence(entity: AuditLogEntry): AuditLogDbRecord {
    return {
      id: entity.id,
      entity_type: entity.entityType,
      entity_id: entity.entityId,
      operation_type: entity.operationType,
      timestamp: entity.timestamp,
      user_id: entity.userId,
      device_id: entity.deviceId,
      synced: entity.synced ? 1 : 0,
    };
  }

  /**
   * Transform multiple database records to domain entities
   *
   * @param dbRecords - Array of database records
   * @returns Array of domain entities
   */
  static toDomainList(dbRecords: AuditLogDbRecord[]): AuditLogEntry[] {
    return dbRecords.map((record) => AuditLogMapper.toDomain(record));
  }
}
