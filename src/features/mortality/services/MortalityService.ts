/**
 * Mortality Service
 *
 * Handles business logic for mortality recording with atomic transactions.
 * Follows Constitution VI: Data Sync Architecture Pattern.
 *
 * Key Features:
 * - Atomic SQLite transaction (mortality record + lot update)
 * - Audit logging for high mortality (>10%)
 * - Validation against lot's live hen count
 * - Automatic sync queue integration
 *
 * Architecture: Repository → Mapper → Service → SyncQueue → SyncService
 */

import { MortalityRecord, ChickenLot, SyncOperation } from '@/shared/types/entities';
import {
  MortalityRecordRepository,
  CreateMortalityRecordData,
} from '@/shared/database/repositories/MortalityRecordRepository';
import { ChickenLotRepository } from '@/shared/database/repositories/ChickenLotRepository';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { AuditService } from '@/shared/sync/AuditService';
import { MortalityRecordHelper } from '../models/MortalityRecord';
import { SQLiteDatabase } from 'expo-sqlite';

/**
 * Service result type
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Mortality Service
 */
export class MortalityService {
  constructor(
    private readonly db: SQLiteDatabase,
    private readonly mortalityRepository: MortalityRecordRepository,
    private readonly lotRepository: ChickenLotRepository,
    private readonly syncQueue: SyncQueue,
    private readonly auditService: AuditService
  ) {}

  /**
   * Record mortality with atomic transaction
   *
   * Transaction steps:
   * 1. Validate lot exists and has enough live hens
   * 2. Create mortality record
   * 3. Update lot's live hen count
   * 4. Check if high mortality (>10%) and log to audit
   * 5. Enqueue both operations for sync
   *
   * If any step fails, entire transaction is rolled back
   */
  async recordMortality(
    lotId: string,
    date: string,
    hensDied: number,
    recordedBy: string
  ): Promise<ServiceResult<{ record: MortalityRecord; lot: ChickenLot }>> {
    try {
      // Step 1: Get lot and validate
      const lot = await this.lotRepository.findById(lotId);
      if (!lot) {
        return {
          success: false,
          error: 'El lote no existe',
        };
      }

      // Validate hen count
      if (hensDied > lot.liveHenCount) {
        return {
          success: false,
          error: `No se puede registrar ${hensDied} gallinas muertas cuando solo hay ${lot.liveHenCount} gallinas vivas`,
        };
      }

      if (hensDied <= 0) {
        return {
          success: false,
          error: 'La cantidad de gallinas muertas debe ser mayor a 0',
        };
      }

      // Generate IDs and timestamps
      const recordId = this.generateUUID();
      const timestamp = new Date().toISOString();

      // Calculate new live hen count
      const newLiveHenCount = lot.liveHenCount - hensDied;

      // Check if high mortality for audit logging
      const isHighMortality = MortalityRecordHelper.isHighMortality(
        hensDied,
        lot.liveHenCount
      );

      // Execute atomic transaction
      await this.db.execAsync(`
        BEGIN TRANSACTION;

        -- Insert mortality record
        INSERT INTO mortality_records
        (id, lot_id, date, hens_died, recorded_by, created_at, updated_at)
        VALUES ('${recordId}', '${lotId}', '${date}', ${hensDied}, '${recordedBy}', '${timestamp}', '${timestamp}');

        -- Update lot live hen count
        UPDATE chicken_lots
        SET live_hen_count = ${newLiveHenCount}, updated_at = '${timestamp}'
        WHERE id = '${lotId}';

        COMMIT;
      `);

      // Retrieve created entities
      const record = await this.mortalityRepository.findById(recordId);
      const updatedLot = await this.lotRepository.findById(lotId);

      if (!record || !updatedLot) {
        throw new Error('Failed to retrieve created entities after transaction');
      }

      // Enqueue for sync (after successful transaction)
      await this.syncQueue.enqueue({
        entityType: 'mortality_records',
        entityId: record.id,
        operation: SyncOperation.Create,
      });

      await this.syncQueue.enqueue({
        entityType: 'chicken_lots',
        entityId: updatedLot.id,
        operation: SyncOperation.Update,
      });

      // Log to audit if high mortality
      if (isHighMortality) {
        await this.auditService.logHighMortality(record.id, recordedBy);
      }

      return {
        success: true,
        data: {
          record,
          lot: updatedLot,
        },
      };
    } catch (error) {
      console.error('Error recording mortality:', error);
      return {
        success: false,
        error: 'Error al registrar la mortalidad. La operación ha sido revertida.',
      };
    }
  }

  /**
   * Update mortality record with atomic transaction
   *
   * Transaction steps:
   * 1. Validate record exists
   * 2. Validate new hensDied value
   * 3. Calculate difference and adjust lot's live hen count
   * 4. Update mortality record
   * 5. Update lot
   * 6. Enqueue both operations for sync
   *
   * If any step fails, entire transaction is rolled back
   */
  async updateMortality(
    recordId: string,
    hensDied: number
  ): Promise<ServiceResult<MortalityRecord>> {
    try {
      // Step 1: Validate record exists
      const existing = await this.mortalityRepository.findById(recordId);
      if (!existing) {
        return {
          success: false,
          error: 'Registro no encontrado',
        };
      }

      // Step 2: Validate hensDied > 0
      if (hensDied <= 0) {
        return {
          success: false,
          error: 'El número de gallinas debe ser mayor a 0',
        };
      }

      // Get lot to validate against live count
      const lot = await this.lotRepository.findById(existing.lotId);
      if (!lot) {
        return {
          success: false,
          error: 'No se encontró el lote',
        };
      }

      // Step 3: Calculate the difference to adjust lot's live count
      const difference = existing.hensDied - hensDied;
      const newLiveHenCount = lot.liveHenCount + difference;

      // Validate new count is valid
      if (newLiveHenCount < 0) {
        return {
          success: false,
          error: `No se puede actualizar: excede el número de gallinas vivas (${lot.liveHenCount})`,
        };
      }

      if (newLiveHenCount > lot.initialHenCount) {
        return {
          success: false,
          error: 'No se puede actualizar: excede el número inicial de gallinas',
        };
      }

      // Step 4: Update in transaction
      const timestamp = new Date().toISOString();

      await this.db.execAsync(`
        BEGIN TRANSACTION;

        -- Update mortality record
        UPDATE mortality_records
        SET hens_died = ${hensDied}, updated_at = '${timestamp}'
        WHERE id = '${recordId}';

        -- Adjust lot's live hen count
        UPDATE chicken_lots
        SET live_hen_count = ${newLiveHenCount}, updated_at = '${timestamp}'
        WHERE id = '${existing.lotId}';

        COMMIT;
      `);

      // Get updated record
      const updated = await this.mortalityRepository.findById(recordId);
      if (!updated) {
        throw new Error('Failed to retrieve updated record');
      }

      // Step 5: Enqueue for sync
      await this.syncQueue.enqueue({
        entityType: 'mortality_records',
        entityId: recordId,
        operation: SyncOperation.Update,
      });

      if (difference !== 0) {
        await this.syncQueue.enqueue({
          entityType: 'chicken_lots',
          entityId: existing.lotId,
          operation: SyncOperation.Update,
        });
      }

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      console.error('Error updating mortality:', error);
      return {
        success: false,
        error: 'Error al actualizar mortalidad',
      };
    }
  }

  /**
   * Get mortality history for a lot
   */
  async getMortalityHistory(lotId: string): Promise<ServiceResult<MortalityRecord[]>> {
    try {
      const records = await this.mortalityRepository.findByLot(lotId);
      return {
        success: true,
        data: records,
      };
    } catch (error) {
      console.error('Error getting mortality history:', error);
      return {
        success: false,
        error: 'Error al obtener el historial de mortalidad',
      };
    }
  }

  /**
   * Get all mortality records for a specific lot and date
   *
   * Returns all individual mortality records for the given day.
   * Used to show detailed breakdown when multiple records exist.
   */
  async getMortalityByDay(
    lotId: string,
    date: string
  ): Promise<ServiceResult<MortalityRecord[]>> {
    try {
      const records = await this.mortalityRepository.findByLotAndDate(
        lotId,
        date
      );
      return {
        success: true,
        data: records,
      };
    } catch (error) {
      console.error('Error getting mortality by day:', error);
      return {
        success: false,
        error: 'Error al obtener mortalidad del día',
      };
    }
  }

  /**
   * Get mortality history by date range
   */
  async getMortalityByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ServiceResult<MortalityRecord[]>> {
    try {
      const records = await this.mortalityRepository.findByDateRange(
        startDate,
        endDate
      );
      return {
        success: true,
        data: records,
      };
    } catch (error) {
      console.error('Error getting mortality by date range:', error);
      return {
        success: false,
        error: 'Error al obtener la mortalidad por rango de fechas',
      };
    }
  }

  /**
   * Get total mortality for a lot
   */
  async getTotalMortality(lotId: string): Promise<ServiceResult<number>> {
    try {
      const total = await this.mortalityRepository.getTotalForLot(lotId);
      return {
        success: true,
        data: total,
      };
    } catch (error) {
      console.error('Error getting total mortality:', error);
      return {
        success: false,
        error: 'Error al obtener la mortalidad total',
      };
    }
  }

  /**
   * Get all mortality records
   */
  async getAllMortalityRecords(): Promise<ServiceResult<MortalityRecord[]>> {
    try {
      const records = await this.mortalityRepository.findAll();
      return {
        success: true,
        data: records,
      };
    } catch (error) {
      console.error('Error getting all mortality records:', error);
      return {
        success: false,
        error: 'Error al obtener los registros de mortalidad',
      };
    }
  }

  /**
   * Generate UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
