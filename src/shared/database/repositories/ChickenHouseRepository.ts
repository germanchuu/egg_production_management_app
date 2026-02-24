/**
 * ChickenHouse Repository
 *
 * Handles all database operations for chicken houses.
 * Implements IRepository interface for standardized data access.
 */

import { SQLiteDatabase } from 'expo-sqlite';
import { IRepository } from './IRepository';
import { ChickenHouse } from '@/shared/types/entities';
import {
  ChickenHouseMapper,
  ChickenHouseDbRecord,
} from '@/features/facilities/mappers/ChickenHouseMapper';

/**
 * Create chicken house data
 */
export interface CreateChickenHouseData {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update chicken house data
 */
export interface UpdateChickenHouseData {
  name?: string;
  description?: string;
  updatedAt: string;
}

/**
 * ChickenHouse Repository
 */
export class ChickenHouseRepository
  implements
    IRepository<ChickenHouse, CreateChickenHouseData, UpdateChickenHouseData>
{
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: string): Promise<ChickenHouse | null> {
    try {
      const result = await this.db.getFirstAsync<ChickenHouseDbRecord>(
        'SELECT * FROM chicken_houses WHERE id = ?',
        [id]
      );

      if (!result) {
        return null;
      }

      return ChickenHouseMapper.toDomain(result);
    } catch (error) {
      console.error('Error finding chicken house by ID:', error);
      throw error;
    }
  }

  async findAll(): Promise<ChickenHouse[]> {
    try {
      const results = await this.db.getAllAsync<ChickenHouseDbRecord>(
        'SELECT * FROM chicken_houses ORDER BY name ASC'
      );

      return ChickenHouseMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding all chicken houses:', error);
      throw error;
    }
  }

  async create(data: CreateChickenHouseData): Promise<ChickenHouse> {
    try {
      // Wrap INSERT in transaction to ensure atomicity and prevent lock conflicts
      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync(
          `INSERT INTO chicken_houses (id, name, description, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            data.id,
            data.name,
            data.description ?? null,
            data.createdBy,
            data.createdAt,
            data.updatedAt,
          ]
        );
      });

      // Read after transaction completes
      const created = await this.findById(data.id);
      if (!created) {
        throw new Error('Failed to retrieve created chicken house');
      }

      return created;
    } catch (error) {
      console.error('Error creating chicken house:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateChickenHouseData
  ): Promise<ChickenHouse> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }

      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
      }

      updates.push('updated_at = ?');
      values.push(data.updatedAt);

      values.push(id);

      await this.db.runAsync(
        `UPDATE chicken_houses SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated chicken house');
      }

      return updated;
    } catch (error) {
      console.error('Error updating chicken house:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM chicken_houses WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting chicken house:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM chicken_houses WHERE id = ?',
        [id]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking chicken house existence:', error);
      throw error;
    }
  }

  /**
   * Check if house name already exists
   */
  async existsByName(name: string): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM chicken_houses WHERE LOWER(name) = LOWER(?)',
        [name]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking chicken house name existence:', error);
      throw error;
    }
  }

  /**
   * Find house by name
   */
  async findByName(name: string): Promise<ChickenHouse | null> {
    try {
      const result = await this.db.getFirstAsync<ChickenHouseDbRecord>(
        'SELECT * FROM chicken_houses WHERE LOWER(name) = LOWER(?)',
        [name]
      );

      if (!result) {
        return null;
      }

      return ChickenHouseMapper.toDomain(result);
    } catch (error) {
      console.error('Error finding chicken house by name:', error);
      throw error;
    }
  }
}
