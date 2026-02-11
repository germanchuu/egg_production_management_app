/**
 * ProductionRecord Mapper
 *
 * Centralizes transformations between database records (snake_case)
 * and domain entities (camelCase) for production records.
 */

import { ProductionRecord } from '@/shared/types/entities';

/**
 * Database record type (snake_case)
 */
export interface ProductionRecordDbRecord {
  id: string;
  lot_id: string;
  date: string;
  eggs_collected: number;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * ProductionRecord Mapper
 */
export class ProductionRecordMapper {
  /**
   * Transform database record to domain entity
   */
  static toDomain(dbRecord: ProductionRecordDbRecord): ProductionRecord {
    return {
      id: dbRecord.id,
      lotId: dbRecord.lot_id,
      date: dbRecord.date,
      eggsCollected: dbRecord.eggs_collected,
      recordedBy: dbRecord.recorded_by,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  /**
   * Transform domain entity to database record
   */
  static toPersistence(entity: ProductionRecord): ProductionRecordDbRecord {
    return {
      id: entity.id,
      lot_id: entity.lotId,
      date: entity.date,
      eggs_collected: entity.eggsCollected,
      recorded_by: entity.recordedBy,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  /**
   * Transform multiple database records to domain entities
   */
  static toDomainList(dbRecords: ProductionRecordDbRecord[]): ProductionRecord[] {
    return dbRecords.map((record) => ProductionRecordMapper.toDomain(record));
  }
}
