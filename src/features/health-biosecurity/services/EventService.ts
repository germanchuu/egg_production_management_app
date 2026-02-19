/**
 * EventService (T135, T136)
 *
 * Business logic for health and biosecurity events.
 * Architecture: Repository → Mapper → Service → SyncQueue → SyncService
 */

import { SyncOperation } from '@/shared/types/entities';
import { HealthEventRepository } from '@/shared/database/repositories/HealthEventRepository';
import { BiosecurityEventRepository } from '@/shared/database/repositories/BiosecurityEventRepository';
import { ChickenLotRepository } from '@/shared/database/repositories/ChickenLotRepository';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { HealthEvent, HealthEventValidator, CreateHealthEventInput } from '../models/HealthEvent';
import {
  BiosecurityEvent,
  BiosecurityEventValidator,
  CreateBiosecurityEventInput,
} from '../models/BiosecurityEvent';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class EventService {
  constructor(
    private readonly healthEventRepository: HealthEventRepository,
    private readonly biosecurityEventRepository: BiosecurityEventRepository,
    private readonly lotRepository: ChickenLotRepository,
    private readonly syncQueue: SyncQueue
  ) {}

  // ─── Health Events ──────────────────────────────────────────────────────────

  /**
   * Record a health event (vaccination) for a lot.
   *
   * Steps:
   * 1. Validate input
   * 2. Validate lot exists
   * 3. Create record
   * 4. Enqueue for sync
   */
  async recordHealthEvent(
    input: CreateHealthEventInput
  ): Promise<ServiceResult<HealthEvent>> {
    try {
      const validation = HealthEventValidator.validateCreate(input);
      if (!validation.valid) {
        return { success: false, error: validation.errors[0] };
      }

      const lot = await this.lotRepository.findById(input.lotId);
      if (!lot) {
        return { success: false, error: 'El lote no existe' };
      }

      const id = this.generateId('health');
      const now = new Date().toISOString();

      const event = await this.healthEventRepository.create({
        id,
        lotId: input.lotId,
        eventType: 'vaccination',
        eventDate: input.eventDate,
        productName: input.productName.trim(),
        notes: input.notes?.trim() || undefined,
        recordedBy: input.recordedBy,
        createdAt: now,
        updatedAt: now,
      });

      await this.syncQueue.enqueue({
        entityType: 'health_events',
        entityId: event.id,
        operation: SyncOperation.Create,
      });

      return { success: true, data: event };
    } catch (error) {
      console.error('Error recording health event:', error);
      return { success: false, error: 'Error al registrar el evento de salud' };
    }
  }

  /**
   * List all health events, sorted by date descending.
   */
  async listHealthEvents(): Promise<ServiceResult<HealthEvent[]>> {
    try {
      const events = await this.healthEventRepository.findAll();
      return { success: true, data: events };
    } catch (error) {
      console.error('Error listing health events:', error);
      return { success: false, error: 'Error al obtener los eventos de salud' };
    }
  }

  /**
   * Get health event history for a specific lot.
   */
  async getHealthEventsByLot(lotId: string): Promise<ServiceResult<HealthEvent[]>> {
    try {
      const events = await this.healthEventRepository.findByLot(lotId);
      return { success: true, data: events };
    } catch (error) {
      console.error('Error getting health events by lot:', error);
      return { success: false, error: 'Error al obtener el historial del lote' };
    }
  }

  // ─── Biosecurity Events ─────────────────────────────────────────────────────

  /**
   * Record a biosecurity event (disinfection) at farm level.
   *
   * Steps:
   * 1. Validate input
   * 2. Create record
   * 3. Enqueue for sync
   */
  async recordBiosecurityEvent(
    input: CreateBiosecurityEventInput
  ): Promise<ServiceResult<BiosecurityEvent>> {
    try {
      const validation = BiosecurityEventValidator.validateCreate(input);
      if (!validation.valid) {
        return { success: false, error: validation.errors[0] };
      }

      const id = this.generateId('biosec');
      const now = new Date().toISOString();

      const event = await this.biosecurityEventRepository.create({
        id,
        eventType: 'disinfection',
        eventDate: input.eventDate,
        productName: input.productName.trim(),
        notes: input.notes?.trim() || undefined,
        recordedBy: input.recordedBy,
        createdAt: now,
        updatedAt: now,
      });

      await this.syncQueue.enqueue({
        entityType: 'biosecurity_events',
        entityId: event.id,
        operation: SyncOperation.Create,
      });

      return { success: true, data: event };
    } catch (error) {
      console.error('Error recording biosecurity event:', error);
      return { success: false, error: 'Error al registrar el evento de bioseguridad' };
    }
  }

  /**
   * List all biosecurity events, sorted by date descending.
   */
  async listBiosecurityEvents(): Promise<ServiceResult<BiosecurityEvent[]>> {
    try {
      const events = await this.biosecurityEventRepository.findAll();
      return { success: true, data: events };
    } catch (error) {
      console.error('Error listing biosecurity events:', error);
      return { success: false, error: 'Error al obtener los eventos de bioseguridad' };
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
