/**
 * MortalityRecord Mapper
 *
 * Centralizes transformations between database records (snake_case)
 * and domain entities (camelCase) for mortality records.
 */

import { MortalityRecord } from '@/shared/types/entities';

/**
 * Database record type (snake_case)
 */
export interface MortalityRecordDbRecord {
  id: string;
  lot_id: string;
  date: string;
  hens_died: number;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * MortalityRecord Mapper
 */
export class MortalityRecordMapper {
  /**
   * Transform database record to domain entity
   */
  static toDomain(dbRecord: MortalityRecordDbRecord): MortalityRecord {
    return {
      id: dbRecord.id,
      lotId: dbRecord.lot_id,
      date: dbRecord.date,
      hensDied: dbRecord.hens_died,
      recordedBy: dbRecord.recorded_by,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  /**
   * Transform domain entity to database record
   */
  static toPersistence(entity: MortalityRecord): MortalityRecordDbRecord {
    return {
      id: entity.id,
      lot_id: entity.lotId,
      date: entity.date,
      hens_died: entity.hensDied,
      recorded_by: entity.recordedBy,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  /**
   * Transform multiple database records to domain entities
   */
  static toDomainList(dbRecords: MortalityRecordDbRecord[]): MortalityRecord[] {
    return dbRecords.map((record) => MortalityRecordMapper.toDomain(record));
  }
}
