/**
 * BiosecurityEvent Repository
 *
 * Handles all database operations for biosecurity events (disinfections).
 * Note: farm-level — no lot_id.
 */

import { SQLiteDatabase } from 'expo-sqlite';
import { BiosecurityEvent } from '@/features/health-biosecurity/models/BiosecurityEvent';
import {
  BiosecurityEventMapper,
  BiosecurityEventDbRecord,
} from '@/features/health-biosecurity/mappers/BiosecurityEventMapper';

export interface CreateBiosecurityEventData {
  id: string;
  eventType: string;
  eventDate: string;
  productName: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export class BiosecurityEventRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: string): Promise<BiosecurityEvent | null> {
    try {
      const result = await this.db.getFirstAsync<BiosecurityEventDbRecord>(
        'SELECT * FROM biosecurity_events WHERE id = ?',
        [id]
      );
      return result ? BiosecurityEventMapper.toDomain(result) : null;
    } catch (error) {
      console.error('Error finding biosecurity event by ID:', error);
      throw error;
    }
  }

  async findAll(): Promise<BiosecurityEvent[]> {
    try {
      const results = await this.db.getAllAsync<BiosecurityEventDbRecord>(
        'SELECT * FROM biosecurity_events ORDER BY event_date DESC, created_at DESC'
      );
      return BiosecurityEventMapper.toDomainList(results);
    } catch (error) {
      console.error('Error finding all biosecurity events:', error);
      throw error;
    }
  }

  async create(data: CreateBiosecurityEventData): Promise<BiosecurityEvent> {
    try {
      await this.db.runAsync(
        `INSERT INTO biosecurity_events
         (id, event_type, event_date, product_name, notes, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
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
      if (!created) throw new Error('Failed to retrieve created biosecurity event');
      return created;
    } catch (error) {
      console.error('Error creating biosecurity event:', error);
      throw error;
    }
  }
}
