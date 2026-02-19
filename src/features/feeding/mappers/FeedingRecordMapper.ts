/**
 * FeedingRecord Mapper
 *
 * Centralizes transformations between database records (snake_case)
 * and domain entities (camelCase) for feeding records.
 * Following Constitution VI: Mapper Layer pattern.
 */

import { FeedingRecord } from '@/shared/types/entities';

/**
 * Database record type (snake_case)
 */
export interface FeedingRecordDbRecord {
  id: string;
  lot_id: string;
  feed_batch_id: string;
  date: string;
  quantity_fed_kg: number;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * FeedingRecord Mapper
 */
export class FeedingRecordMapper {
  /**
   * Transform database record to domain entity
   */
  static toDomain(dbRecord: FeedingRecordDbRecord): FeedingRecord {
    return {
      id: dbRecord.id,
      lotId: dbRecord.lot_id,
      feedBatchId: dbRecord.feed_batch_id,
      date: dbRecord.date,
      quantityFedKg: dbRecord.quantity_fed_kg,
      recordedBy: dbRecord.recorded_by,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  /**
   * Transform domain entity to database record
   */
  static toPersistence(entity: FeedingRecord): FeedingRecordDbRecord {
    return {
      id: entity.id,
      lot_id: entity.lotId,
      feed_batch_id: entity.feedBatchId,
      date: entity.date,
      quantity_fed_kg: entity.quantityFedKg,
      recorded_by: entity.recordedBy,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  /**
   * Transform multiple database records to domain entities
   */
  static toDomainList(dbRecords: FeedingRecordDbRecord[]): FeedingRecord[] {
    return dbRecords.map((r) => this.toDomain(r));
  }
}
