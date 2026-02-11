/**
 * Production Service
 *
 * Handles business logic for production recording.
 * Follows Constitution VI: Data Sync Architecture Pattern.
 *
 * Key Features:
 * - Production record creation with validation
 * - Metrics calculation (daily and lifetime eggs per hen)
 * - Smart defaults (recent lot from localStorage)
 * - Automatic sync queue integration
 *
 * Architecture: Repository → Mapper → Service → SyncQueue → SyncService
 */

import {
  ProductionRecord,
  ChickenLot,
  SyncOperation,
} from '@/shared/types/entities';
import {
  ProductionRecordRepository,
  CreateProductionRecordData,
} from '@/shared/database/repositories/ProductionRecordRepository';
import { ChickenLotRepository } from '@/shared/database/repositories/ChickenLotRepository';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { ProductionRecordHelper } from '../models/ProductionRecord';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service result type
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Production metrics type
 */
export interface ProductionMetrics {
  dailyEggsPerHen: number;
  lifetimeEggsPerHen: number;
  totalEggs: number;
  averageDaily: number;
}

/**
 * Production Service
 */
export class ProductionService {
  private static readonly RECENT_LOT_KEY = '@production:recent_lot';

  constructor(
    private readonly productionRepository: ProductionRecordRepository,
    private readonly lotRepository: ChickenLotRepository,
    private readonly syncQueue: SyncQueue
  ) {}

  /**
   * Record production for a lot
   *
   * Steps:
   * 1. Validate lot exists and has live hens
   * 2. Check unique constraint (lot + date)
   * 3. Validate eggs collected is reasonable
   * 4. Create production record
   * 5. Store recent lot ID
   * 6. Enqueue for sync
   */
  async recordProduction(
    lotId: string,
    date: string,
    eggsCollected: number,
    recordedBy: string
  ): Promise<ServiceResult<ProductionRecord>> {
    try {
      // Step 1: Get lot and validate
      const lot = await this.lotRepository.findById(lotId);
      if (!lot) {
        return {
          success: false,
          error: 'El lote no existe',
        };
      }

      // Check if lot has live hens
      if (lot.liveHenCount <= 0) {
        return {
          success: false,
          error: 'No se puede registrar producción para un lote sin gallinas vivas',
        };
      }

      // Step 2: Check unique constraint (one record per lot per day)
      const existing = await this.productionRepository.findByLotAndDate(
        lotId,
        date
      );
      if (existing) {
        return {
          success: false,
          error: `Ya existe un registro de producción para este lote en la fecha ${date}`,
        };
      }

      // Step 3: Validate eggs collected
      if (eggsCollected <= 0) {
        return {
          success: false,
          error: 'La cantidad de huevos recolectados debe ser mayor a 0',
        };
      }

      // Check if production is reasonable (warning, not blocking)
      const eggsPerHen = eggsCollected / lot.liveHenCount;
      if (eggsPerHen > 2) {
        console.warn(
          `Alta producción detectada: ${eggsCollected} huevos para ${lot.liveHenCount} gallinas (${eggsPerHen.toFixed(2)} huevos/gallina)`
        );
      }

      // Step 4: Create production record
      const recordId = this.generateUUID();
      const timestamp = new Date().toISOString();

      const data: CreateProductionRecordData = {
        id: recordId,
        lotId,
        date,
        eggsCollected,
        recordedBy,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const record = await this.productionRepository.create(data);

      // Step 5: Store recent lot ID for smart defaults
      await this.saveRecentLot(lotId);

      // Step 6: Enqueue for sync
      await this.syncQueue.enqueue({
        entityType: 'production_records',
        entityId: record.id,
        operation: SyncOperation.Create,
      });

      return {
        success: true,
        data: record,
      };
    } catch (error) {
      console.error('Error recording production:', error);
      return {
        success: false,
        error: 'Error al registrar la producción',
      };
    }
  }

  /**
   * Update production record
   *
   * Note: Production records should generally be immutable for audit purposes.
   * This method is provided for corrections only.
   *
   * Steps:
   * 1. Validate record exists
   * 2. Validate new eggs collected value
   * 3. Update record
   * 4. Enqueue for sync
   */
  async updateProduction(
    recordId: string,
    eggsCollected: number
  ): Promise<ServiceResult<ProductionRecord>> {
    try {
      // Step 1: Check record exists
      const existing = await this.productionRepository.findById(recordId);
      if (!existing) {
        return {
          success: false,
          error: 'El registro de producción no existe',
        };
      }

      // Step 2: Validate eggs collected
      if (eggsCollected <= 0) {
        return {
          success: false,
          error: 'La cantidad de huevos recolectados debe ser mayor a 0',
        };
      }

      // Step 3: Update record
      const timestamp = new Date().toISOString();
      const updated = await this.productionRepository.update(recordId, {
        eggsCollected,
        updatedAt: timestamp,
      });

      // Step 4: Enqueue for sync
      await this.syncQueue.enqueue({
        entityType: 'production_records',
        entityId: updated.id,
        operation: SyncOperation.Update,
      });

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      console.error('Error updating production:', error);
      return {
        success: false,
        error: 'Error al actualizar la producción',
      };
    }
  }

  /**
   * Get production history for a lot
   */
  async getProductionHistory(
    lotId: string
  ): Promise<ServiceResult<ProductionRecord[]>> {
    try {
      const records = await this.productionRepository.findByLot(lotId);
      return {
        success: true,
        data: records,
      };
    } catch (error) {
      console.error('Error getting production history:', error);
      return {
        success: false,
        error: 'Error al obtener el historial de producción',
      };
    }
  }

  /**
   * Get production history by date range
   */
  async getProductionByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ServiceResult<ProductionRecord[]>> {
    try {
      const records = await this.productionRepository.findByDateRange(
        startDate,
        endDate
      );
      return {
        success: true,
        data: records,
      };
    } catch (error) {
      console.error('Error getting production by date range:', error);
      return {
        success: false,
        error: 'Error al obtener la producción por rango de fechas',
      };
    }
  }

  /**
   * Calculate lifetime eggs per hen for a lot
   *
   * Formula: SUM(eggs_collected) / initial_hen_count
   *
   * Note: Uses initial hen count, not current live count, to measure
   * lifetime productivity of the flock.
   */
  async calculateLifetimeEggsPerHen(
    lotId: string
  ): Promise<ServiceResult<number>> {
    try {
      const lot = await this.lotRepository.findById(lotId);
      if (!lot) {
        return {
          success: false,
          error: 'El lote no existe',
        };
      }

      const totalEggs = await this.productionRepository.getTotalEggsForLot(
        lotId
      );

      // Use initial hen count for lifetime metric
      const lifetimeEggsPerHen =
        lot.initialHenCount > 0 ? totalEggs / lot.initialHenCount : 0;

      return {
        success: true,
        data: Number(lifetimeEggsPerHen.toFixed(2)),
      };
    } catch (error) {
      console.error('Error calculating lifetime eggs per hen:', error);
      return {
        success: false,
        error: 'Error al calcular huevos por gallina de por vida',
      };
    }
  }

  /**
   * Calculate production metrics for a lot
   *
   * Includes:
   * - Daily eggs per hen (from most recent record)
   * - Lifetime eggs per hen (total eggs / initial hen count)
   * - Total eggs collected
   * - Average daily production
   */
  async calculateMetrics(lotId: string): Promise<ServiceResult<ProductionMetrics>> {
    try {
      const lot = await this.lotRepository.findById(lotId);
      if (!lot) {
        return {
          success: false,
          error: 'El lote no existe',
        };
      }

      const records = await this.productionRepository.findByLot(lotId);
      const totalEggs = await this.productionRepository.getTotalEggsForLot(
        lotId
      );

      // Daily eggs per hen: most recent record
      let dailyEggsPerHen = 0;
      if (records.length > 0 && lot.liveHenCount > 0) {
        const mostRecent = records[0]; // Already sorted by date DESC
        dailyEggsPerHen = ProductionRecordHelper.calculateEggsPerHen(
          mostRecent.eggsCollected,
          lot.liveHenCount
        );
      }

      // Lifetime eggs per hen: total / initial count
      const lifetimeEggsPerHen =
        lot.initialHenCount > 0
          ? Number((totalEggs / lot.initialHenCount).toFixed(2))
          : 0;

      // Average daily production
      const averageDaily =
        records.length > 0
          ? Number((totalEggs / records.length).toFixed(0))
          : 0;

      return {
        success: true,
        data: {
          dailyEggsPerHen,
          lifetimeEggsPerHen,
          totalEggs,
          averageDaily,
        },
      };
    } catch (error) {
      console.error('Error calculating production metrics:', error);
      return {
        success: false,
        error: 'Error al calcular las métricas de producción',
      };
    }
  }

  /**
   * Get all production records
   */
  async getAllProductionRecords(): Promise<ServiceResult<ProductionRecord[]>> {
    try {
      const records = await this.productionRepository.findAll();
      return {
        success: true,
        data: records,
      };
    } catch (error) {
      console.error('Error getting all production records:', error);
      return {
        success: false,
        error: 'Error al obtener los registros de producción',
      };
    }
  }

  /**
   * Get most recently used lot ID from localStorage
   *
   * Returns null if no recent lot found.
   * Used for smart defaults in the production form.
   */
  async getRecentLot(): Promise<string | null> {
    try {
      const lotId = await AsyncStorage.getItem(ProductionService.RECENT_LOT_KEY);
      return lotId;
    } catch (error) {
      console.error('Error getting recent lot:', error);
      return null;
    }
  }

  /**
   * Save recently used lot ID to localStorage
   */
  private async saveRecentLot(lotId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(ProductionService.RECENT_LOT_KEY, lotId);
    } catch (error) {
      console.error('Error saving recent lot:', error);
      // Don't throw - this is a nice-to-have feature
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
