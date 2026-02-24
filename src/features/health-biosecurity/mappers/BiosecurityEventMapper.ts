/**
 * BiosecurityEvent Mapper
 *
 * Transforms between SQLite snake_case records and camelCase domain models.
 */

import { LotEventType } from '@/shared/types/entities';
import { BiosecurityEvent } from '../models/BiosecurityEvent';

export interface BiosecurityEventDbRecord {
  id: string;
  event_type: string;
  event_date: string;
  product_name: string;
  notes: string | null;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

export class BiosecurityEventMapper {
  static toDomain(db: BiosecurityEventDbRecord): BiosecurityEvent {
    return {
      id: db.id,
      eventType: LotEventType.Disinfection,
      eventDate: db.event_date,
      productName: db.product_name,
      notes: db.notes ?? undefined,
      recordedBy: db.recorded_by,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  static toDomainList(records: BiosecurityEventDbRecord[]): BiosecurityEvent[] {
    return records.map((r) => this.toDomain(r));
  }
}
