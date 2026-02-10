/**
 * ChickenLot Mapper
 *
 * Centralizes transformations between database records (snake_case)
 * and domain entities (camelCase) for chicken lots.
 */

import { ChickenLot } from '@/shared/types/entities';

/**
 * Database record type (snake_case)
 */
export interface ChickenLotDbRecord {
  id: string;
  name: string;
  chicken_house_id: string;
  purchase_date: string;
  initial_hen_count: number;
  live_hen_count: number;
  age_weeks: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * ChickenLot Mapper
 */
export class ChickenLotMapper {
  /**
   * Transform database record to domain entity
   */
  static toDomain(dbRecord: ChickenLotDbRecord): ChickenLot {
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      chickenHouseId: dbRecord.chicken_house_id,
      purchaseDate: dbRecord.purchase_date,
      initialHenCount: dbRecord.initial_hen_count,
      liveHenCount: dbRecord.live_hen_count,
      ageWeeks: dbRecord.age_weeks,
      createdBy: dbRecord.created_by,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  /**
   * Transform domain entity to database record
   */
  static toPersistence(entity: ChickenLot): ChickenLotDbRecord {
    return {
      id: entity.id,
      name: entity.name,
      chicken_house_id: entity.chickenHouseId,
      purchase_date: entity.purchaseDate,
      initial_hen_count: entity.initialHenCount,
      live_hen_count: entity.liveHenCount,
      age_weeks: entity.ageWeeks,
      created_by: entity.createdBy,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  /**
   * Transform multiple database records to domain entities
   */
  static toDomainList(dbRecords: ChickenLotDbRecord[]): ChickenLot[] {
    return dbRecords.map((record) => ChickenLotMapper.toDomain(record));
  }
}
