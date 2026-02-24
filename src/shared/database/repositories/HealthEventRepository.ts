/**
 * HealthEvent Repository
 *
 * Handles all database operations for health events (vaccinations).
 */

import { SQLiteDatabase } from 'expo-sqlite';
import { HealthEvent } from '@/features/health-biosecurity/models/HealthEvent';
import {
  HealthEventMapper,
  HealthEventDbRecord,
} from '@/features/health-biosecurity/mappers/HealthEventMapper';

export interface CreateHealthEventData {
  id: string;
  lotId: string;
  eventType: string;
  eventDate: string;
  productName: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export class HealthEventRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: string): Promise<HealthEvent | null> {
    try {
      const result = await this.db.getFirstAsync<HealthEventDbRecord>(
        'SELECT * FROM health_events WHERE id = ?',
        [id]
      );
      return result ? HealthEventMapper.toDomain(result) : null;
    } catch (error) {
      console.error('Error finding health event by ID:', error);
      throw error;
    }
  }

  async findAll(): Promise<HealthEvent[]> {
    try {
      const results = await this.db.getAllAsync<HealthEventDbRecord>(
        'SELECT * FROM health_events ORDER BY event_date DESC, created_at DESC'
      );
      return HealthEventMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding all health events:', error);
      throw error;
    }
  }

  async findByLot(lotId: string): Promise<HealthEvent[]> {
    try {
      const results = await this.db.getAllAsync<HealthEventDbRecord>(
        'SELECT * FROM health_events WHERE lot_id = ? ORDER BY event_date DESC, created_at DESC',
        [lotId]
      );
      return HealthEventMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding health events by lot:', error);
      throw error;
    }
  }

  async create(data: CreateHealthEventData): Promise<HealthEvent> {
    try {
      await this.db.runAsync(
        `INSERT INTO health_events
         (id, lot_id, event_type, event_date, product_name, notes, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.lotId,
          data.eventType,
          data.eventDate,
          data.productName,
          data.notes ?? null,
          data.recordedBy,
          data.createdAt,
          data.updatedAt,
        ]
      );

      const created = await this.findById(data.id);
      if (!created) throw new Error('Failed to retrieve created health event');
      return created;
    } catch (error) {
      console.error('Error creating health event:', error);
      throw error;
    }
  }
}
