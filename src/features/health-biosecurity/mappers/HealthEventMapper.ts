/**
 * HealthEvent Mapper
 *
 * Transforms between SQLite snake_case records and camelCase domain models.
 */

import { LotEventType } from '@/shared/types/entities';
import { HealthEvent } from '../models/HealthEvent';

export interface HealthEventDbRecord {
  id: string;
  lot_id: string;
  event_type: string;
  event_date: string;
  product_name: string;
  notes: string | null;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

export class HealthEventMapper {
  static toDomain(db: HealthEventDbRecord): HealthEvent {
    return {
      id: db.id,
      lotId: db.lot_id,
      eventType: LotEventType.Vaccination,
      eventDate: db.event_date,
      productName: db.product_name,
      notes: db.notes ?? undefined,
      recordedBy: db.recorded_by,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  static toDomainList(records: HealthEventDbRecord[]): HealthEvent[] {
    return records.map((r) => this.toDomain(r));
  }
}
