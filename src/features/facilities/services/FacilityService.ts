/**
 * Facility Service
 *
 * Handles business logic for chicken houses and lots management.
 * Follows Constitution VI: Data Sync Architecture Pattern.
 *
 * Architecture: Repository → Mapper → Service → SyncQueue → SyncService
 */

import { ChickenHouse, ChickenLot, SyncOperation } from '@/shared/types/entities';
import {
  ChickenHouseRepository,
  CreateChickenHouseData,
  UpdateChickenHouseData,
} from '@/shared/database/repositories/ChickenHouseRepository';
import {
  ChickenLotRepository,
  CreateChickenLotData,
  UpdateChickenLotData,
} from '@/shared/database/repositories/ChickenLotRepository';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { ChickenLotCompute } from '../models/ChickenLot';

/**
 * Service result type
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Facility Service
 */
export class FacilityService {
  constructor(
    private readonly houseRepository: ChickenHouseRepository,
    private readonly lotRepository: ChickenLotRepository,
    private readonly syncQueue: SyncQueue
  ) {}

  /**
   * Create a new chicken house
   */
  async createHouse(
    name: string,
    description: string | undefined,
    createdBy: string
  ): Promise<ServiceResult<ChickenHouse>> {
    try {
      // Check if name already exists
      const exists = await this.houseRepository.existsByName(name);
      if (exists) {
        return {
          success: false,
          error: `Ya existe un galpón con el nombre "${name}"`,
        };
      }

      // Generate ID and timestamps
      const id = this.generateUUID();
      const timestamp = new Date().toISOString();

      const houseData: CreateChickenHouseData = {
        id,
        name,
        description,
        createdBy,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // Create house
      const house = await this.houseRepository.create(houseData);

      // Enqueue for sync
      await this.syncQueue.enqueue({
        entityType: 'chicken_houses',
        entityId: house.id,
        operation: SyncOperation.Create,
      });

      return {
        success: true,
        data: house,
      };
    } catch (error) {
      console.error('Error creating chicken house:', error);
      return {
        success: false,
        error: 'Error al crear el galpón',
      };
    }
  }

  /**
   * List all chicken houses
   */
  async listHouses(): Promise<ServiceResult<ChickenHouse[]>> {
    try {
      const houses = await this.houseRepository.findAll();
      return {
        success: true,
        data: houses,
      };
    } catch (error) {
      console.error('Error listing chicken houses:', error);
      return {
        success: false,
        error: 'Error al listar galpones',
      };
    }
  }

  /**
   * Create a new chicken lot
   */
  async createLot(
    name: string,
    chickenHouseId: string,
    purchaseDate: string,
    initialHenCount: number,
    ageWeeks: number,
    createdBy: string
  ): Promise<ServiceResult<ChickenLot>> {
    try {
      // Validate house exists
      const houseExists = await this.houseRepository.exists(chickenHouseId);
      if (!houseExists) {
        return {
          success: false,
          error: 'El galpón seleccionado no existe',
        };
      }

      // Generate ID and timestamps
      const id = this.generateUUID();
      const timestamp = new Date().toISOString();

      const lotData: CreateChickenLotData = {
        id,
        name,
        chickenHouseId,
        purchaseDate,
        initialHenCount,
        liveHenCount: initialHenCount, // Starts equal to initial
        ageWeeks,
        createdBy,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // Create lot
      const lot = await this.lotRepository.create(lotData);

      // Enqueue for sync
      await this.syncQueue.enqueue({
        entityType: 'chicken_lots',
        entityId: lot.id,
        operation: SyncOperation.Create,
      });

      return {
        success: true,
        data: lot,
      };
    } catch (error) {
      console.error('Error creating chicken lot:', error);
      return {
        success: false,
        error: 'Error al crear el lote',
      };
    }
  }

  /**
   * List all chicken lots
   */
  async listLots(): Promise<ServiceResult<ChickenLot[]>> {
    try {
      const lots = await this.lotRepository.findAll();
      return {
        success: true,
        data: lots,
      };
    } catch (error) {
      console.error('Error listing chicken lots:', error);
      return {
        success: false,
        error: 'Error al listar lotes',
      };
    }
  }

  /**
   * Get lot details with computed fields
   */
  async getLotDetails(lotId: string): Promise<ServiceResult<ChickenLot>> {
    try {
      const lot = await this.lotRepository.findById(lotId);
      if (!lot) {
        return {
          success: false,
          error: 'Lote no encontrado',
        };
      }

      return {
        success: true,
        data: lot,
      };
    } catch (error) {
      console.error('Error getting lot details:', error);
      return {
        success: false,
        error: 'Error al obtener detalles del lote',
      };
    }
  }

  /**
   * Update live hen count (used by MortalityService)
   */
  async updateLiveHenCount(
    lotId: string,
    newLiveHenCount: number
  ): Promise<ServiceResult<ChickenLot>> {
    try {
      const lot = await this.lotRepository.updateLiveHenCount(
        lotId,
        newLiveHenCount
      );

      // Enqueue for sync
      await this.syncQueue.enqueue({
        entityType: 'chicken_lots',
        entityId: lot.id,
        operation: SyncOperation.Update,
      });

      return {
        success: true,
        data: lot,
      };
    } catch (error) {
      console.error('Error updating live hen count:', error);
      return {
        success: false,
        error: 'Error al actualizar el conteo de gallinas',
      };
    }
  }

  /**
   * List active lots only
   */
  async listActiveLots(): Promise<ServiceResult<ChickenLot[]>> {
    try {
      const lots = await this.lotRepository.findActive();
      return {
        success: true,
        data: lots,
      };
    } catch (error) {
      console.error('Error listing active lots:', error);
      return {
        success: false,
        error: 'Error al listar lotes activos',
      };
    }
  }

  /**
   * List lots by house
   */
  async listLotsByHouse(houseId: string): Promise<ServiceResult<ChickenLot[]>> {
    try {
      const lots = await this.lotRepository.findByHouse(houseId);
      return {
        success: true,
        data: lots,
      };
    } catch (error) {
      console.error('Error listing lots by house:', error);
      return {
        success: false,
        error: 'Error al listar lotes del galpón',
      };
    }
  }

  /**
   * Get house details by ID
   */
  async getHouseDetails(houseId: string): Promise<ServiceResult<ChickenHouse>> {
    try {
      const house = await this.houseRepository.findById(houseId);
      if (!house) {
        return {
          success: false,
          error: 'Galpón no encontrado',
        };
      }

      return {
        success: true,
        data: house,
      };
    } catch (error) {
      console.error('Error getting house details:', error);
      return {
        success: false,
        error: 'Error al obtener detalles del galpón',
      };
    }
  }

  /**
   * Update a chicken house
   */
  async updateHouse(
    houseId: string,
    name: string,
    description: string | undefined,
    updatedBy: string
  ): Promise<ServiceResult<ChickenHouse>> {
    try {
      // Check if house exists
      const exists = await this.houseRepository.exists(houseId);
      if (!exists) {
        return {
          success: false,
          error: 'Galpón no encontrado',
        };
      }

      // Check if new name conflicts with another house
      const existingHouse = await this.houseRepository.findByName(name);
      if (existingHouse && existingHouse.id !== houseId) {
        return {
          success: false,
          error: `Ya existe otro galpón con el nombre "${name}"`,
        };
      }

      const timestamp = new Date().toISOString();

      const updateData: UpdateChickenHouseData = {
        name,
        description,
        updatedAt: timestamp,
      };

      // Update house
      const house = await this.houseRepository.update(houseId, updateData);

      // Enqueue for sync
      await this.syncQueue.enqueue({
        entityType: 'chicken_houses',
        entityId: house.id,
        operation: SyncOperation.Update,
      });

      return {
        success: true,
        data: house,
      };
    } catch (error) {
      console.error('Error updating chicken house:', error);
      return {
        success: false,
        error: 'Error al actualizar el galpón',
      };
    }
  }

  /**
   * Delete a chicken house
   */
  async deleteHouse(
    houseId: string,
    deletedBy: string
  ): Promise<ServiceResult<void>> {
    try {
      // Check if house exists
      const exists = await this.houseRepository.exists(houseId);
      if (!exists) {
        return {
          success: false,
          error: 'Galpón no encontrado',
        };
      }

      // Check if house has active lots
      const lots = await this.lotRepository.findByHouse(houseId);
      if (lots.length > 0) {
        return {
          success: false,
          error: 'No se puede eliminar un galpón con lotes asociados',
        };
      }

      // Delete house
      await this.houseRepository.delete(houseId);

      // Enqueue for sync
      await this.syncQueue.enqueue({
        entityType: 'chicken_houses',
        entityId: houseId,
        operation: SyncOperation.Delete,
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting chicken house:', error);
      return {
        success: false,
        error: 'Error al eliminar el galpón',
      };
    }
  }

  /**
   * Update a chicken lot (name only - other fields are immutable)
   */
  async updateLot(
    lotId: string,
    name: string,
    updatedBy: string
  ): Promise<ServiceResult<ChickenLot>> {
    try {
      // Check if lot exists
      const existingLot = await this.lotRepository.findById(lotId);
      if (!existingLot) {
        return {
          success: false,
          error: 'Lote no encontrado',
        };
      }

      const timestamp = new Date().toISOString();

      const updateData: UpdateChickenLotData = {
        name,
        updatedAt: timestamp,
      };

      // Update lot
      const lot = await this.lotRepository.update(lotId, updateData);

      // Enqueue for sync
      await this.syncQueue.enqueue({
        entityType: 'chicken_lots',
        entityId: lot.id,
        operation: SyncOperation.Update,
      });

      return {
        success: true,
        data: lot,
      };
    } catch (error) {
      console.error('Error updating chicken lot:', error);
      return {
        success: false,
        error: 'Error al actualizar el lote',
      };
    }
  }

  /**
   * Delete a chicken lot
   */
  async deleteLot(
    lotId: string,
    deletedBy: string
  ): Promise<ServiceResult<void>> {
    try {
      // Check if lot exists
      const exists = await this.lotRepository.exists(lotId);
      if (!exists) {
        return {
          success: false,
          error: 'Lote no encontrado',
        };
      }

      // Delete lot
      await this.lotRepository.delete(lotId);

      // Enqueue for sync
      await this.syncQueue.enqueue({
        entityType: 'chicken_lots',
        entityId: lotId,
        operation: SyncOperation.Delete,
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting chicken lot:', error);
      return {
        success: false,
        error: 'Error al eliminar el lote',
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
