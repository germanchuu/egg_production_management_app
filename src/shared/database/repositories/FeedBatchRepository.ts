/**
 * FeedBatch Repository
 *
 * Handles all database operations for feed batches.
 * Implements IRepository interface for standardized data access.
 */

import { SQLiteDatabase } from 'expo-sqlite';
import { IRepository } from './IRepository';
import { FeedBatch } from '@/shared/types/entities';
import {
  FeedBatchMapper,
  FeedBatchDbRecord,
} from '@/features/feeding/mappers/FeedBatchMapper';

/**
 * Create feed batch data
 */
export interface CreateFeedBatchData {
  id: string;
  batchName: string;
  preparationDate: string;
  quantityKg: number;
  preparedBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update feed batch data
 */
export interface UpdateFeedBatchData {
  batchName?: string;
  preparationDate?: string;
  quantityKg?: number;
  updatedAt: string;
}

/**
 * FeedBatch Repository
 */
export class FeedBatchRepository
  implements IRepository<FeedBatch, CreateFeedBatchData, UpdateFeedBatchData>
{
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: string): Promise<FeedBatch | null> {
    try {
      const result = await this.db.getFirstAsync<FeedBatchDbRecord>(
        'SELECT * FROM feed_batches WHERE id = ?',
        [id]
      );

      if (!result) {
        return null;
      }

      return FeedBatchMapper.toDomain(result);
    } catch (error) {
      console.error('Error finding feed batch by ID:', error);
      throw error;
    }
  }

  async findAll(): Promise<FeedBatch[]> {
    try {
      const results = await this.db.getAllAsync<FeedBatchDbRecord>(
        'SELECT * FROM feed_batches ORDER BY preparation_date DESC, created_at DESC'
      );

      return FeedBatchMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding all feed batches:', error);
      throw error;
    }
  }

  async create(data: CreateFeedBatchData): Promise<FeedBatch> {
    try {
      await this.db.runAsync(
        `INSERT INTO feed_batches
         (id, batch_name, preparation_date, quantity_kg, prepared_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.batchName,
          data.preparationDate,
          data.quantityKg,
          data.preparedBy,
          data.createdAt,
          data.updatedAt,
        ]
      );

      const created = await this.findById(data.id);
      if (!created) {
        throw new Error('Failed to retrieve created feed batch');
      }

      return created;
    } catch (error) {
      console.error('Error creating feed batch:', error);
      throw error;
    }
  }

  async update(id: string, data: UpdateFeedBatchData): Promise<FeedBatch> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.batchName !== undefined) {
        updates.push('batch_name = ?');
        values.push(data.batchName);
      }

      if (data.preparationDate !== undefined) {
        updates.push('preparation_date = ?');
        values.push(data.preparationDate);
      }

      if (data.quantityKg !== undefined) {
        updates.push('quantity_kg = ?');
        values.push(data.quantityKg);
      }

      updates.push('updated_at = ?');
      values.push(data.updatedAt);

      values.push(id);

      await this.db.runAsync(
        `UPDATE feed_batches SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated feed batch');
      }

      return updated;
    } catch (error) {
      console.error('Error updating feed batch:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM feed_batches WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting feed batch:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM feed_batches WHERE id = ?',
        [id]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking feed batch existence:', error);
      throw error;
    }
  }

  /**
   * Get total quantity fed from a batch (sum of all feeding records)
   */
  async getTotalFedKg(batchId: string): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ total: number }>(
        'SELECT COALESCE(SUM(quantity_fed_kg), 0) as total FROM feeding_records WHERE feed_batch_id = ?',
        [batchId]
      );

      return result?.total ?? 0;
    } catch (error) {
      console.error('Error getting total fed kg for batch:', error);
      throw error;
    }
  }
}
