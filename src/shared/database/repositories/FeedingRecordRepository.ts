/**
 * FeedingRecord Repository
 *
 * Handles all database operations for feeding records.
 * Implements IRepository interface for standardized data access.
 */

import { SQLiteDatabase } from 'expo-sqlite';
import { IRepository } from './IRepository';
import { FeedingRecord } from '@/shared/types/entities';
import {
  FeedingRecordMapper,
  FeedingRecordDbRecord,
} from '@/features/feeding/mappers/FeedingRecordMapper';

/**
 * Create feeding record data
 */
export interface CreateFeedingRecordData {
  id: string;
  lotId: string;
  feedBatchId: string;
  date: string;
  quantityFedKg: number;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update feeding record data
 */
export interface UpdateFeedingRecordData {
  date?: string;
  quantityFedKg?: number;
  updatedAt: string;
}

/**
 * FeedingRecord Repository
 */
export class FeedingRecordRepository
  implements
    IRepository<
      FeedingRecord,
      CreateFeedingRecordData,
      UpdateFeedingRecordData
    >
{
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: string): Promise<FeedingRecord | null> {
    try {
      const result = await this.db.getFirstAsync<FeedingRecordDbRecord>(
        'SELECT * FROM feeding_records WHERE id = ?',
        [id]
      );

      if (!result) {
        return null;
      }

      return FeedingRecordMapper.toDomain(result);
    } catch (error) {
      console.error('Error finding feeding record by ID:', error);
      throw error;
    }
  }

  async findAll(): Promise<FeedingRecord[]> {
    try {
      const results = await this.db.getAllAsync<FeedingRecordDbRecord>(
        'SELECT * FROM feeding_records ORDER BY date DESC, created_at DESC'
      );

      return FeedingRecordMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding all feeding records:', error);
      throw error;
    }
  }

  async create(data: CreateFeedingRecordData): Promise<FeedingRecord> {
    try {
      await this.db.runAsync(
        `INSERT INTO feeding_records
         (id, lot_id, feed_batch_id, date, quantity_fed_kg, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.lotId,
          data.feedBatchId,
          data.date,
          data.quantityFedKg,
          data.recordedBy,
          data.createdAt,
          data.updatedAt,
        ]
      );

      const created = await this.findById(data.id);
      if (!created) {
        throw new Error('Failed to retrieve created feeding record');
      }

      return created;
    } catch (error) {
      console.error('Error creating feeding record:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateFeedingRecordData
  ): Promise<FeedingRecord> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.date !== undefined) {
        updates.push('date = ?');
        values.push(data.date);
      }

      if (data.quantityFedKg !== undefined) {
        updates.push('quantity_fed_kg = ?');
        values.push(data.quantityFedKg);
      }

      updates.push('updated_at = ?');
      values.push(data.updatedAt);

      values.push(id);

      await this.db.runAsync(
        `UPDATE feeding_records SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated feeding record');
      }

      return updated;
    } catch (error) {
      console.error('Error updating feeding record:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM feeding_records WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting feeding record:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM feeding_records WHERE id = ?',
        [id]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking feeding record existence:', error);
      throw error;
    }
  }

  /**
   * Find feeding records by lot
   */
  async findByLot(lotId: string): Promise<FeedingRecord[]> {
    try {
      const results = await this.db.getAllAsync<FeedingRecordDbRecord>(
        'SELECT * FROM feeding_records WHERE lot_id = ? ORDER BY date DESC',
        [lotId]
      );

      return FeedingRecordMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding feeding records by lot:', error);
      throw error;
    }
  }

  /**
   * Find feeding records by feed batch
   */
  async findByBatch(feedBatchId: string): Promise<FeedingRecord[]> {
    try {
      const results = await this.db.getAllAsync<FeedingRecordDbRecord>(
        'SELECT * FROM feeding_records WHERE feed_batch_id = ? ORDER BY date DESC',
        [feedBatchId]
      );

      return FeedingRecordMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding feeding records by batch:', error);
      throw error;
    }
  }

  /**
   * Get total quantity fed for a batch
   */
  async getTotalFedKgForBatch(feedBatchId: string): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ total: number }>(
        'SELECT COALESCE(SUM(quantity_fed_kg), 0) as total FROM feeding_records WHERE feed_batch_id = ?',
        [feedBatchId]
      );

      return result?.total ?? 0;
    } catch (error) {
      console.error('Error getting total fed kg for batch:', error);
      throw error;
    }
  }

  /**
   * Find feeding records by date range
   */
  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<FeedingRecord[]> {
    try {
      const results = await this.db.getAllAsync<FeedingRecordDbRecord>(
        'SELECT * FROM feeding_records WHERE date >= ? AND date <= ? ORDER BY date DESC',
        [startDate, endDate]
      );

      return FeedingRecordMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding feeding records by date range:', error);
      throw error;
    }
  }
}
