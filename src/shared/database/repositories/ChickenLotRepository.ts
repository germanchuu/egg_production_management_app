/**
 * ChickenLot Repository
 *
 * Handles all database operations for chicken lots.
 * Implements IRepository interface for standardized data access.
 */

import { SQLiteDatabase } from 'expo-sqlite';
import { IRepository } from './IRepository';
import { ChickenLot } from '@/shared/types/entities';
import {
  ChickenLotMapper,
  ChickenLotDbRecord,
} from '@/features/facilities/mappers/ChickenLotMapper';

/**
 * Create chicken lot data
 */
export interface CreateChickenLotData {
  id: string;
  name: string;
  chickenHouseId: string;
  purchaseDate: string;
  initialHenCount: number;
  liveHenCount: number;
  ageWeeks: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update chicken lot data
 */
export interface UpdateChickenLotData {
  name?: string;
  liveHenCount?: number;
  updatedAt: string;
}

/**
 * ChickenLot Repository
 */
export class ChickenLotRepository
  implements IRepository<ChickenLot, CreateChickenLotData, UpdateChickenLotData>
{
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: string): Promise<ChickenLot | null> {
    try {
      const result = await this.db.getFirstAsync<ChickenLotDbRecord>(
        'SELECT * FROM chicken_lots WHERE id = ?',
        [id]
      );

      if (!result) {
        return null;
      }

      return ChickenLotMapper.toDomain(result);
    } catch (error) {
      console.error('Error finding chicken lot by ID:', error);
      throw error;
    }
  }

  async findAll(): Promise<ChickenLot[]> {
    try {
      const results = await this.db.getAllAsync<ChickenLotDbRecord>(
        'SELECT * FROM chicken_lots ORDER BY created_at DESC'
      );

      return ChickenLotMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding all chicken lots:', error);
      throw error;
    }
  }

  async create(data: CreateChickenLotData): Promise<ChickenLot> {
    try {
      // Wrap INSERT in transaction to ensure atomicity and prevent lock conflicts
      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync(
          `INSERT INTO chicken_lots
           (id, name, chicken_house_id, purchase_date, initial_hen_count,
            live_hen_count, age_weeks, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.id,
            data.name,
            data.chickenHouseId,
            data.purchaseDate,
            data.initialHenCount,
            data.liveHenCount,
            data.ageWeeks,
            data.createdBy,
            data.createdAt,
            data.updatedAt,
          ]
        );
      });

      // Read after transaction completes
      const created = await this.findById(data.id);
      if (!created) {
        throw new Error('Failed to retrieve created chicken lot');
      }

      return created;
    } catch (error) {
      console.error('Error creating chicken lot:', error);
      throw error;
    }
  }

  async update(id: string, data: UpdateChickenLotData): Promise<ChickenLot> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }

      if (data.liveHenCount !== undefined) {
        updates.push('live_hen_count = ?');
        values.push(data.liveHenCount);
      }

      updates.push('updated_at = ?');
      values.push(data.updatedAt);

      values.push(id);

      await this.db.runAsync(
        `UPDATE chicken_lots SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated chicken lot');
      }

      return updated;
    } catch (error) {
      console.error('Error updating chicken lot:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM chicken_lots WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting chicken lot:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM chicken_lots WHERE id = ?',
        [id]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking chicken lot existence:', error);
      throw error;
    }
  }

  /**
   * Find lots by chicken house
   */
  async findByHouse(houseId: string): Promise<ChickenLot[]> {
    try {
      const results = await this.db.getAllAsync<ChickenLotDbRecord>(
        'SELECT * FROM chicken_lots WHERE chicken_house_id = ? ORDER BY created_at DESC',
        [houseId]
      );

      return ChickenLotMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding chicken lots by house:', error);
      throw error;
    }
  }

  /**
   * Find active lots (liveHenCount > 0)
   */
  async findActive(): Promise<ChickenLot[]> {
    try {
      const results = await this.db.getAllAsync<ChickenLotDbRecord>(
        'SELECT * FROM chicken_lots WHERE live_hen_count > 0 ORDER BY created_at DESC'
      );

      return ChickenLotMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding active chicken lots:', error);
      throw error;
    }
  }

  /**
   * Update live hen count (called by MortalityService)
   * Uses atomic decrement to ensure consistency
   */
  async updateLiveHenCount(
    lotId: string,
    newLiveHenCount: number
  ): Promise<ChickenLot> {
    try {
      const updatedAt = new Date().toISOString();

      await this.db.runAsync(
        'UPDATE chicken_lots SET live_hen_count = ?, updated_at = ? WHERE id = ?',
        [newLiveHenCount, updatedAt, lotId]
      );

      const updated = await this.findById(lotId);
      if (!updated) {
        throw new Error('Failed to retrieve updated chicken lot');
      }

      return updated;
    } catch (error) {
      console.error('Error updating live hen count:', error);
      throw error;
    }
  }

  /**
   * Decrement live hen count atomically (for mortality records)
   */
  async decrementLiveHenCount(
    lotId: string,
    decrementBy: number
  ): Promise<ChickenLot> {
    try {
      const updatedAt = new Date().toISOString();

      await this.db.runAsync(
        'UPDATE chicken_lots SET live_hen_count = live_hen_count - ?, updated_at = ? WHERE id = ?',
        [decrementBy, updatedAt, lotId]
      );

      const updated = await this.findById(lotId);
      if (!updated) {
        throw new Error('Failed to retrieve updated chicken lot');
      }

      return updated;
    } catch (error) {
      console.error('Error decrementing live hen count:', error);
      throw error;
    }
  }
}
