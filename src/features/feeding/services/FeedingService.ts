/**
 * Feeding Service (T120, T121)
 *
 * Handles business logic for feed batch management and feeding records.
 * Follows Constitution VI: Data Sync Architecture Pattern.
 *
 * Architecture: Repository → Mapper → Service → SyncQueue → SyncService
 */

import { FeedBatch, FeedingRecord, SyncOperation } from '@/shared/types/entities';
import {
  FeedBatchRepository,
  CreateFeedBatchData,
} from '@/shared/database/repositories/FeedBatchRepository';
import {
  FeedingRecordRepository,
  CreateFeedingRecordData,
} from '@/shared/database/repositories/FeedingRecordRepository';
import { ChickenLotRepository } from '@/shared/database/repositories/ChickenLotRepository';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import {
  FeedBatchValidator,
  FeedBatchHelper,
  CreateFeedBatchInput,
} from '../models/FeedBatch';
import {
  FeedingRecordValidator,
  FeedingRecordHelper,
  CreateFeedingRecordInput,
} from '../models/FeedingRecord';

/**
 * Service result type
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warning?: string;
}

/**
 * FeedBatch with computed remaining quantity
 */
export interface FeedBatchWithRemaining extends FeedBatch {
  remainingQuantityKg: number;
}

/**
 * FeedingRecord with computed feedPerHen
 */
export interface FeedingRecordWithMetrics extends FeedingRecord {
  feedPerHen: number;
}

/**
 * Feeding Service
 */
export class FeedingService {
  constructor(
    private readonly feedBatchRepository: FeedBatchRepository,
    private readonly feedingRecordRepository: FeedingRecordRepository,
    private readonly lotRepository: ChickenLotRepository,
    private readonly syncQueue: SyncQueue
  ) {}

  /**
   * Create a new feed batch
   *
   * Steps:
   * 1. Validate input data
   * 2. Create feed batch record
   * 3. Enqueue for sync
   */
  async createFeedBatch(
    input: CreateFeedBatchInput
  ): Promise<ServiceResult<FeedBatchWithRemaining>> {
    try {
      // Step 1: Validate input
      const validation = FeedBatchValidator.validateCreate(input);
      if (!validation.valid) {
        return { success: false, error: validation.errors[0] };
      }

      // Step 2: Create feed batch record
      const id = this.generateId('batch');
      const now = new Date().toISOString();

      const data: CreateFeedBatchData = {
        id,
        batchName: input.batchName.trim(),
        preparationDate: input.preparationDate,
        quantityKg: Number(input.quantityKg.toFixed(2)),
        preparedBy: input.preparedBy,
        createdAt: now,
        updatedAt: now,
      };

      const batch = await this.feedBatchRepository.create(data);

      // Step 3: Enqueue for sync (T121)
      await this.syncQueue.enqueue({
        entityType: 'feed_batches',
        entityId: batch.id,
        operation: SyncOperation.Create,
      });

      return {
        success: true,
        data: { ...batch, remainingQuantityKg: batch.quantityKg },
      };
    } catch (error) {
      console.error('Error creating feed batch:', error);
      return { success: false, error: 'Error al crear el lote de alimento' };
    }
  }

  /**
   * List all feed batches with computed remaining quantity
   */
  async listFeedBatches(): Promise<ServiceResult<FeedBatchWithRemaining[]>> {
    try {
      const batches = await this.feedBatchRepository.findAll();

      const batchesWithRemaining: FeedBatchWithRemaining[] = await Promise.all(
        batches.map(async (batch) => {
          const totalFedKg =
            await this.feedingRecordRepository.getTotalFedKgForBatch(batch.id);
          const remainingQuantityKg = FeedBatchHelper.calculateRemainingQuantityKg(
            batch.quantityKg,
            totalFedKg
          );
          return { ...batch, remainingQuantityKg };
        })
      );

      return { success: true, data: batchesWithRemaining };
    } catch (error) {
      console.error('Error listing feed batches:', error);
      return {
        success: false,
        error: 'Error al obtener los lotes de alimento',
      };
    }
  }

  /**
   * Record a feeding event for a lot
   *
   * Steps:
   * 1. Validate input data
   * 2. Validate lot exists and has live hens
   * 3. Validate feed batch exists
   * 4. Warn if quantity exceeds remaining batch quantity (T123)
   * 5. Create feeding record
   * 6. Enqueue for sync (T121)
   */
  async recordFeeding(
    input: CreateFeedingRecordInput
  ): Promise<ServiceResult<FeedingRecordWithMetrics>> {
    try {
      // Step 1: Validate input
      const validation = FeedingRecordValidator.validateCreate(input);
      if (!validation.valid) {
        return { success: false, error: validation.errors[0] };
      }

      // Step 2: Validate lot exists and has live hens
      const lot = await this.lotRepository.findById(input.lotId);
      if (!lot) {
        return { success: false, error: 'El lote no existe' };
      }

      if (lot.liveHenCount <= 0) {
        return {
          success: false,
          error: 'No se puede registrar alimentación para un lote sin gallinas vivas',
        };
      }

      // Step 3: Validate feed batch exists
      const batch = await this.feedBatchRepository.findById(input.feedBatchId);
      if (!batch) {
        return { success: false, error: 'El lote de alimento no existe' };
      }

      // Step 4: Check if quantity exceeds remaining (warning only - T123)
      const totalFedKg = await this.feedingRecordRepository.getTotalFedKgForBatch(
        input.feedBatchId
      );
      const remainingKg = FeedBatchHelper.calculateRemainingQuantityKg(
        batch.quantityKg,
        totalFedKg
      );

      let warning: string | undefined;
      if (FeedBatchHelper.wouldExceedRemaining(input.quantityFedKg, remainingKg)) {
        warning = `La cantidad (${input.quantityFedKg} kg) supera el disponible en el lote (${remainingKg.toFixed(2)} kg)`;
        console.warn(`Feeding exceeds batch remaining: ${warning}`);
      }

      // Step 5: Create feeding record
      const id = this.generateId('feed');
      const now = new Date().toISOString();

      const data: CreateFeedingRecordData = {
        id,
        lotId: input.lotId,
        feedBatchId: input.feedBatchId,
        date: input.date,
        quantityFedKg: Number(input.quantityFedKg.toFixed(2)),
        recordedBy: input.recordedBy,
        createdAt: now,
        updatedAt: now,
      };

      const record = await this.feedingRecordRepository.create(data);

      // Step 6: Enqueue for sync (T121)
      await this.syncQueue.enqueue({
        entityType: 'feeding_records',
        entityId: record.id,
        operation: SyncOperation.Create,
      });

      const feedPerHen = FeedingRecordHelper.calculateFeedPerHen(
        record.quantityFedKg,
        lot.liveHenCount
      );

      return {
        success: true,
        data: { ...record, feedPerHen },
        warning,
      };
    } catch (error) {
      console.error('Error recording feeding:', error);
      return { success: false, error: 'Error al registrar la alimentación' };
    }
  }

  /**
   * Get feeding history for a lot with feedPerHen computed
   */
  async getFeedingHistory(
    lotId: string
  ): Promise<ServiceResult<FeedingRecordWithMetrics[]>> {
    try {
      const lot = await this.lotRepository.findById(lotId);
      if (!lot) {
        return { success: false, error: 'El lote no existe' };
      }

      const records = await this.feedingRecordRepository.findByLot(lotId);

      const recordsWithMetrics: FeedingRecordWithMetrics[] = records.map(
        (record) => ({
          ...record,
          feedPerHen: FeedingRecordHelper.calculateFeedPerHen(
            record.quantityFedKg,
            lot.liveHenCount
          ),
        })
      );

      return { success: true, data: recordsWithMetrics };
    } catch (error) {
      console.error('Error getting feeding history:', error);
      return {
        success: false,
        error: 'Error al obtener el historial de alimentación',
      };
    }
  }

  /**
   * Calculate total feed consumed for a lot
   */
  async calculateTotalFeedConsumed(
    lotId: string
  ): Promise<ServiceResult<number>> {
    try {
      const records = await this.feedingRecordRepository.findByLot(lotId);
      const total = records.reduce((sum, r) => sum + r.quantityFedKg, 0);
      return { success: true, data: Number(total.toFixed(2)) };
    } catch (error) {
      console.error('Error calculating total feed consumed:', error);
      return {
        success: false,
        error: 'Error al calcular el total de alimento consumido',
      };
    }
  }

  /**
   * Calculate average feed per hen for a lot
   */
  async calculateAverageFeedPerHen(
    lotId: string
  ): Promise<ServiceResult<number>> {
    try {
      const lot = await this.lotRepository.findById(lotId);
      if (!lot) {
        return { success: false, error: 'El lote no existe' };
      }

      const records = await this.feedingRecordRepository.findByLot(lotId);
      if (records.length === 0) {
        return { success: true, data: 0 };
      }

      const recordsWithMetrics = records.map((record) => ({
        ...record,
        feedPerHen: FeedingRecordHelper.calculateFeedPerHen(
          record.quantityFedKg,
          lot.liveHenCount
        ),
      }));

      const totalFeedPerHen = recordsWithMetrics.reduce(
        (sum, r) => sum + r.feedPerHen,
        0
      );
      const average = Number((totalFeedPerHen / records.length).toFixed(4));

      return { success: true, data: average };
    } catch (error) {
      console.error('Error calculating average feed per hen:', error);
      return {
        success: false,
        error: 'Error al calcular el promedio de alimento por gallina',
      };
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
