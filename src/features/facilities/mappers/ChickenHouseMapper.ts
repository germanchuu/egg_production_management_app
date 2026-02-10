/**
 * ChickenHouse Mapper
 *
 * Centralizes transformations between database records (snake_case)
 * and domain entities (camelCase) for chicken houses.
 */

import { ChickenHouse } from '@/shared/types/entities';

/**
 * Database record type (snake_case)
 */
export interface ChickenHouseDbRecord {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * ChickenHouse Mapper
 */
export class ChickenHouseMapper {
  /**
   * Transform database record to domain entity
   */
  static toDomain(dbRecord: ChickenHouseDbRecord): ChickenHouse {
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      description: dbRecord.description ?? undefined,
      createdBy: dbRecord.created_by,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  /**
   * Transform domain entity to database record
   */
  static toPersistence(entity: ChickenHouse): ChickenHouseDbRecord {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description ?? null,
      created_by: entity.createdBy,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  /**
   * Transform multiple database records to domain entities
   */
  static toDomainList(dbRecords: ChickenHouseDbRecord[]): ChickenHouse[] {
    return dbRecords.map((record) => ChickenHouseMapper.toDomain(record));
  }
}
