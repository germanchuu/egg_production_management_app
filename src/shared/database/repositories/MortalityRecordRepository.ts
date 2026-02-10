/**
 * MortalityRecord Repository
 *
 * Handles all database operations for mortality records.
 * Implements IRepository interface for standardized data access.
 */

import { SQLiteDatabase } from 'expo-sqlite';
import { IRepository } from './IRepository';
import { MortalityRecord } from '@/shared/types/entities';
import {
  MortalityRecordMapper,
  MortalityRecordDbRecord,
} from '@/features/mortality/mappers/MortalityRecordMapper';

/**
 * Create mortality record data
 */
export interface CreateMortalityRecordData {
  id: string;
  lotId: string;
  date: string;
  hensDied: number;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update mortality record data
 */
export interface UpdateMortalityRecordData {
  date?: string;
  hensDied?: number;
  updatedAt: string;
}

/**
 * MortalityRecord Repository
 */
export class MortalityRecordRepository
  implements
    IRepository<
      MortalityRecord,
      CreateMortalityRecordData,
      UpdateMortalityRecordData
    >
{
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: string): Promise<MortalityRecord | null> {
    try {
      const result = await this.db.getFirstAsync<MortalityRecordDbRecord>(
        'SELECT * FROM mortality_records WHERE id = ?',
        [id]
      );

      if (!result) {
        return null;
      }

      return MortalityRecordMapper.toDomain(result);
    } catch (error) {
      console.error('Error finding mortality record by ID:', error);
      throw error;
    }
  }

  async findAll(): Promise<MortalityRecord[]> {
    try {
      const results = await this.db.getAllAsync<MortalityRecordDbRecord>(
        'SELECT * FROM mortality_records ORDER BY date DESC, created_at DESC'
      );

      return MortalityRecordMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding all mortality records:', error);
      throw error;
    }
  }

  async create(data: CreateMortalityRecordData): Promise<MortalityRecord> {
    try {
      await this.db.runAsync(
        `INSERT INTO mortality_records
         (id, lot_id, date, hens_died, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.lotId,
          data.date,
          data.hensDied,
          data.recordedBy,
          data.createdAt,
          data.updatedAt,
        ]
      );

      const created = await this.findById(data.id);
      if (!created) {
        throw new Error('Failed to retrieve created mortality record');
      }

      return created;
    } catch (error) {
      console.error('Error creating mortality record:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateMortalityRecordData
  ): Promise<MortalityRecord> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.date !== undefined) {
        updates.push('date = ?');
        values.push(data.date);
      }

      if (data.hensDied !== undefined) {
        updates.push('hens_died = ?');
        values.push(data.hensDied);
      }

      updates.push('updated_at = ?');
      values.push(data.updatedAt);

      values.push(id);

      await this.db.runAsync(
        `UPDATE mortality_records SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated mortality record');
      }

      return updated;
    } catch (error) {
      console.error('Error updating mortality record:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM mortality_records WHERE id = ?', [
        id,
      ]);
    } catch (error) {
      console.error('Error deleting mortality record:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM mortality_records WHERE id = ?',
        [id]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking mortality record existence:', error);
      throw error;
    }
  }

  /**
   * Find mortality records by lot
   */
  async findByLot(lotId: string): Promise<MortalityRecord[]> {
    try {
      const results = await this.db.getAllAsync<MortalityRecordDbRecord>(
        'SELECT * FROM mortality_records WHERE lot_id = ? ORDER BY date DESC',
        [lotId]
      );

      return MortalityRecordMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding mortality records by lot:', error);
      throw error;
    }
  }

  /**
   * Find mortality records by date range
   */
  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<MortalityRecord[]> {
    try {
      const results = await this.db.getAllAsync<MortalityRecordDbRecord>(
        'SELECT * FROM mortality_records WHERE date >= ? AND date <= ? ORDER BY date DESC',
        [startDate, endDate]
      );

      return MortalityRecordMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding mortality records by date range:', error);
      throw error;
    }
  }

  /**
   * Get total mortality for a lot
   */
  async getTotalForLot(lotId: string): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ total: number }>(
        'SELECT SUM(hens_died) as total FROM mortality_records WHERE lot_id = ?',
        [lotId]
      );

      return result?.total || 0;
    } catch (error) {
      console.error('Error getting total mortality for lot:', error);
      throw error;
    }
  }
}
