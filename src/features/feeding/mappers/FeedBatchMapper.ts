/**
 * FeedBatch Mapper
 *
 * Centralizes transformations between database records (snake_case)
 * and domain entities (camelCase) for feed batches.
 * Following Constitution VI: Mapper Layer pattern.
 */

import { FeedBatch } from '@/shared/types/entities';

/**
 * Database record type (snake_case)
 */
export interface FeedBatchDbRecord {
  id: string;
  batch_name: string;
  preparation_date: string;
  quantity_kg: number;
  prepared_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * FeedBatch Mapper
 */
export class FeedBatchMapper {
  /**
   * Transform database record to domain entity
   */
  static toDomain(dbRecord: FeedBatchDbRecord): FeedBatch {
    return {
      id: dbRecord.id,
      batchName: dbRecord.batch_name,
      preparationDate: dbRecord.preparation_date,
      quantityKg: dbRecord.quantity_kg,
      preparedBy: dbRecord.prepared_by,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  /**
   * Transform domain entity to database record
   */
  static toPersistence(entity: FeedBatch): FeedBatchDbRecord {
    return {
      id: entity.id,
      batch_name: entity.batchName,
      preparation_date: entity.preparationDate,
      quantity_kg: entity.quantityKg,
      prepared_by: entity.preparedBy,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  /**
   * Transform multiple database records to domain entities
   */
  static toDomainList(dbRecords: FeedBatchDbRecord[]): FeedBatch[] {
    return dbRecords.map((r) => this.toDomain(r));
  }
}
