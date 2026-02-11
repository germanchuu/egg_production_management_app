/**
 * ProductionRecord Repository
 *
 * Handles all database operations for production records.
 * Implements IRepository interface for standardized data access.
 */

import { SQLiteDatabase } from 'expo-sqlite';
import { IRepository } from './IRepository';
import { ProductionRecord } from '@/shared/types/entities';
import {
  ProductionRecordMapper,
  ProductionRecordDbRecord,
} from '@/features/production/mappers/ProductionRecordMapper';

/**
 * Create production record data
 */
export interface CreateProductionRecordData {
  id: string;
  lotId: string;
  date: string;
  eggsCollected: number;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update production record data
 */
export interface UpdateProductionRecordData {
  date?: string;
  eggsCollected?: number;
  updatedAt: string;
}

/**
 * ProductionRecord Repository
 */
export class ProductionRecordRepository
  implements
    IRepository<
      ProductionRecord,
      CreateProductionRecordData,
      UpdateProductionRecordData
    >
{
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: string): Promise<ProductionRecord | null> {
    try {
      const result = await this.db.getFirstAsync<ProductionRecordDbRecord>(
        'SELECT * FROM production_records WHERE id = ?',
        [id]
      );

      if (!result) {
        return null;
      }

      return ProductionRecordMapper.toDomain(result);
    } catch (error) {
      console.error('Error finding production record by ID:', error);
      throw error;
    }
  }

  async findAll(): Promise<ProductionRecord[]> {
    try {
      const results = await this.db.getAllAsync<ProductionRecordDbRecord>(
        'SELECT * FROM production_records ORDER BY date DESC, created_at DESC'
      );

      return ProductionRecordMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding all production records:', error);
      throw error;
    }
  }

  async create(data: CreateProductionRecordData): Promise<ProductionRecord> {
    try {
      await this.db.runAsync(
        `INSERT INTO production_records
         (id, lot_id, date, eggs_collected, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.lotId,
          data.date,
          data.eggsCollected,
          data.recordedBy,
          data.createdAt,
          data.updatedAt,
        ]
      );

      const created = await this.findById(data.id);
      if (!created) {
        throw new Error('Failed to retrieve created production record');
      }

      return created;
    } catch (error) {
      console.error('Error creating production record:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateProductionRecordData
  ): Promise<ProductionRecord> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.date !== undefined) {
        updates.push('date = ?');
        values.push(data.date);
      }

      if (data.eggsCollected !== undefined) {
        updates.push('eggs_collected = ?');
        values.push(data.eggsCollected);
      }

      updates.push('updated_at = ?');
      values.push(data.updatedAt);

      values.push(id);

      await this.db.runAsync(
        `UPDATE production_records SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated production record');
      }

      return updated;
    } catch (error) {
      console.error('Error updating production record:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM production_records WHERE id = ?', [
        id,
      ]);
    } catch (error) {
      console.error('Error deleting production record:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM production_records WHERE id = ?',
        [id]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking production record existence:', error);
      throw error;
    }
  }

  /**
   * Find production records by lot
   */
  async findByLot(lotId: string): Promise<ProductionRecord[]> {
    try {
      const results = await this.db.getAllAsync<ProductionRecordDbRecord>(
        'SELECT * FROM production_records WHERE lot_id = ? ORDER BY date DESC',
        [lotId]
      );

      return ProductionRecordMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding production records by lot:', error);
      throw error;
    }
  }

  /**
   * Find production records by date range
   */
  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ProductionRecord[]> {
    try {
      const results = await this.db.getAllAsync<ProductionRecordDbRecord>(
        'SELECT * FROM production_records WHERE date >= ? AND date <= ? ORDER BY date DESC',
        [startDate, endDate]
      );

      return ProductionRecordMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding production records by date range:', error);
      throw error;
    }
  }

  /**
   * Get total eggs collected for a lot
   */
  async getTotalEggsForLot(lotId: string): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ total: number }>(
        'SELECT SUM(eggs_collected) as total FROM production_records WHERE lot_id = ?',
        [lotId]
      );

      return result?.total || 0;
    } catch (error) {
      console.error('Error getting total eggs for lot:', error);
      throw error;
    }
  }

  /**
   * Find production record by lot and date (for unique constraint check)
   */
  async findByLotAndDate(
    lotId: string,
    date: string
  ): Promise<ProductionRecord | null> {
    try {
      const result = await this.db.getFirstAsync<ProductionRecordDbRecord>(
        'SELECT * FROM production_records WHERE lot_id = ? AND date = ?',
        [lotId, date]
      );

      if (!result) {
        return null;
      }

      return ProductionRecordMapper.toDomain(result);
    } catch (error) {
      console.error('Error finding production record by lot and date:', error);
      throw error;
    }
  }
}
