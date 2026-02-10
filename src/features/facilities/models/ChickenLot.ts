/**
 * ChickenLot Model
 *
 * Represents a group of chickens purchased together and tracked over their lifetime.
 * Lots are housed in chicken houses and have production/mortality records.
 *
 * Business Rules:
 * - initialHenCount is immutable after creation
 * - liveHenCount is updated automatically via mortality records
 * - liveHenCount must be >= 0 and <= initialHenCount
 * - purchaseDate cannot be in the future
 * - Lot must be assigned to a valid chicken house
 * - Computed fields (age, mortality, production) calculated on-demand
 *
 * This model extends the shared ChickenLot entity type with
 * facilities-specific business logic, validation, and computed fields.
 */

import {
  ChickenLot as ChickenLotEntity,
  ChickenLotComputed,
} from '@/shared/types/entities';

/**
 * ChickenLot model interface (extends shared entity)
 */
export type ChickenLot = ChickenLotEntity;

/**
 * ChickenLot with computed fields
 */
export type ChickenLotWithComputed = ChickenLot & ChickenLotComputed;

/**
 * ChickenLot creation input
 */
export interface CreateChickenLotInput {
  name: string;
  chickenHouseId: string;
  purchaseDate: string; // ISO-8601 date (YYYY-MM-DD)
  initialHenCount: number;
  ageWeeks: number; // Age in weeks at purchase
  createdBy: string;
}

/**
 * ChickenLot update input (only live hen count can be updated manually)
 */
export interface UpdateChickenLotInput {
  name?: string;
  // Note: liveHenCount updates happen automatically via MortalityService
}

/**
 * ChickenLot validation helper functions
 */
export class ChickenLotValidator {
  /**
   * Validates lot name
   */
  static isValidName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }
    const trimmed = name.trim();
    return trimmed.length >= 1 && trimmed.length <= 100;
  }

  /**
   * Validates initial hen count
   * Must be positive integer
   */
  static isValidInitialHenCount(count: number): boolean {
    return Number.isInteger(count) && count > 0;
  }

  /**
   * Validates live hen count
   * Must be >= 0 and <= initialHenCount
   */
  static isValidLiveHenCount(liveCount: number, initialCount: number): boolean {
    return (
      Number.isInteger(liveCount) &&
      liveCount >= 0 &&
      liveCount <= initialCount
    );
  }

  /**
   * Validates age in weeks at purchase
   * Must be positive integer
   */
  static isValidAgeWeeks(ageWeeks: number): boolean {
    return Number.isInteger(ageWeeks) && ageWeeks > 0 && ageWeeks <= 200; // Max 200 weeks (~4 years)
  }

  /**
   * Validates purchase date
   * Cannot be in the future
   */
  static isValidPurchaseDate(dateString: string): boolean {
    if (!dateString || typeof dateString !== 'string') {
      return false;
    }

    // Check format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check not in future
    return date <= today && !isNaN(date.getTime());
  }

  /**
   * Validates complete lot data for creation
   */
  static validateCreate(input: CreateChickenLotInput): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!ChickenLotValidator.isValidName(input.name)) {
      errors.push('El nombre del lote es requerido (1-100 caracteres)');
    }

    if (!input.chickenHouseId || input.chickenHouseId.trim().length === 0) {
      errors.push('El galpón es requerido');
    }

    if (!ChickenLotValidator.isValidPurchaseDate(input.purchaseDate)) {
      errors.push('La fecha de compra es inválida o está en el futuro');
    }

    if (!ChickenLotValidator.isValidInitialHenCount(input.initialHenCount)) {
      errors.push('La cantidad inicial de gallinas debe ser mayor a 0');
    }

    if (!ChickenLotValidator.isValidAgeWeeks(input.ageWeeks)) {
      errors.push('La edad en semanas debe ser mayor a 0 y menor a 200');
    }

    if (!input.createdBy || input.createdBy.trim().length === 0) {
      errors.push('El usuario creador es requerido');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * ChickenLot computed fields calculator
 */
export class ChickenLotCompute {
  /**
   * Calculate current age in weeks
   * currentAgeWeeks = ageWeeks + weeksSince(purchaseDate)
   */
  static calculateCurrentAgeWeeks(lot: ChickenLot): number {
    const purchaseDate = new Date(lot.purchaseDate);
    const today = new Date();

    const diffMs = today.getTime() - purchaseDate.getTime();
    const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));

    return lot.ageWeeks + diffWeeks;
  }

  /**
   * Calculate total mortality count
   * totalMortality = initialHenCount - liveHenCount
   */
  static calculateTotalMortality(lot: ChickenLot): number {
    return lot.initialHenCount - lot.liveHenCount;
  }

  /**
   * Calculate mortality rate as percentage
   * mortalityRate = (totalMortality / initialHenCount) * 100
   */
  static calculateMortalityRate(lot: ChickenLot): number {
    const totalMortality = ChickenLotCompute.calculateTotalMortality(lot);
    if (lot.initialHenCount === 0) {
      return 0;
    }
    return (totalMortality / lot.initialHenCount) * 100;
  }

  /**
   * Calculate lifetime eggs per hen
   * This requires production data and should be calculated by ProductionService
   * Placeholder here for type consistency
   */
  static calculateLifetimeEggsPerHen(
    lot: ChickenLot,
    totalEggsCollected: number
  ): number {
    if (lot.initialHenCount === 0) {
      return 0;
    }
    return totalEggsCollected / lot.initialHenCount;
  }

  /**
   * Add all computed fields to a lot
   */
  static withComputedFields(
    lot: ChickenLot,
    totalEggsCollected: number = 0
  ): ChickenLotWithComputed {
    return {
      ...lot,
      currentAgeWeeks: ChickenLotCompute.calculateCurrentAgeWeeks(lot),
      totalMortality: ChickenLotCompute.calculateTotalMortality(lot),
      mortalityRate: ChickenLotCompute.calculateMortalityRate(lot),
      lifetimeEggsPerHen: ChickenLotCompute.calculateLifetimeEggsPerHen(
        lot,
        totalEggsCollected
      ),
    };
  }
}

/**
 * ChickenLot factory functions
 */
export class ChickenLotFactory {
  /**
   * Create a new chicken lot object (not persisted)
   */
  static create(
    input: CreateChickenLotInput
  ): Omit<ChickenLot, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: input.name.trim(),
      chickenHouseId: input.chickenHouseId,
      purchaseDate: input.purchaseDate,
      initialHenCount: input.initialHenCount,
      liveHenCount: input.initialHenCount, // Starts equal to initial count
      ageWeeks: input.ageWeeks,
      createdBy: input.createdBy,
    };
  }

  /**
   * Create display name for lot (used in UI)
   */
  static getDisplayName(lot: ChickenLot): string {
    const currentAge = ChickenLotCompute.calculateCurrentAgeWeeks(lot);
    return `${lot.name} (${currentAge} semanas, ${lot.liveHenCount} gallinas)`;
  }
}

/**
 * ChickenLot helper functions
 */
export class ChickenLotHelper {
  /**
   * Check if lot is active (has live hens)
   */
  static isActive(lot: ChickenLot): boolean {
    return lot.liveHenCount > 0;
  }

  /**
   * Check if lot is inactive (zero live hens)
   */
  static isInactive(lot: ChickenLot): boolean {
    return lot.liveHenCount === 0;
  }

  /**
   * Check if mortality rate is high (>10%)
   */
  static hasHighMortality(lot: ChickenLot): boolean {
    const mortalityRate = ChickenLotCompute.calculateMortalityRate(lot);
    return mortalityRate > 10;
  }

  /**
   * Sort lots by creation date (newest first)
   */
  static sortByCreatedDate(lots: ChickenLot[]): ChickenLot[] {
    return [...lots].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Sort lots by current age (oldest first)
   */
  static sortByAge(lots: ChickenLot[]): ChickenLot[] {
    return [...lots].sort((a, b) => {
      const ageA = ChickenLotCompute.calculateCurrentAgeWeeks(a);
      const ageB = ChickenLotCompute.calculateCurrentAgeWeeks(b);
      return ageB - ageA;
    });
  }

  /**
   * Filter active lots only
   */
  static filterActive(lots: ChickenLot[]): ChickenLot[] {
    return lots.filter((lot) => ChickenLotHelper.isActive(lot));
  }

  /**
   * Filter lots by chicken house
   */
  static filterByHouse(lots: ChickenLot[], houseId: string): ChickenLot[] {
    return lots.filter((lot) => lot.chickenHouseId === houseId);
  }

  /**
   * Get lot statistics summary
   */
  static getStatistics(lots: ChickenLot[]): {
    totalLots: number;
    activeLots: number;
    inactiveLots: number;
    totalLiveHens: number;
    averageMortalityRate: number;
  } {
    const activeLots = lots.filter((lot) => ChickenLotHelper.isActive(lot));
    const totalLiveHens = lots.reduce((sum, lot) => sum + lot.liveHenCount, 0);

    const totalMortalityRate = lots.reduce(
      (sum, lot) => sum + ChickenLotCompute.calculateMortalityRate(lot),
      0
    );
    const averageMortalityRate =
      lots.length > 0 ? totalMortalityRate / lots.length : 0;

    return {
      totalLots: lots.length,
      activeLots: activeLots.length,
      inactiveLots: lots.length - activeLots.length,
      totalLiveHens,
      averageMortalityRate,
    };
  }
}
