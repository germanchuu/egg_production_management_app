/**
 * MortalityRecord Model
 *
 * Represents daily mortality events for chicken lots.
 * Automatically updates lot's liveHenCount when recorded.
 *
 * Business Rules:
 * - hensDied must be > 0 (at least 1 hen died)
 * - hensDied cannot exceed lot's current liveHenCount
 * - date cannot be in the future
 * - High mortality (>10% of live count) triggers audit log
 * - Each mortality record atomically decrements liveHenCount
 *
 * This model extends the shared MortalityRecord entity type with
 * mortality-specific business logic and validation.
 */

import { MortalityRecord as MortalityRecordEntity } from '@/shared/types/entities';

/**
 * MortalityRecord model interface (extends shared entity)
 */
export type MortalityRecord = MortalityRecordEntity;

/**
 * MortalityRecord creation input
 */
export interface CreateMortalityRecordInput {
  lotId: string;
  date: string; // ISO-8601 date (YYYY-MM-DD)
  hensDied: number;
  recordedBy: string;
}

/**
 * MortalityRecord validation helper functions
 */
export class MortalityRecordValidator {
  /**
   * Validates mortality count
   * Must be positive integer > 0
   */
  static isValidHensDied(hensDied: number): boolean {
    return Number.isInteger(hensDied) && hensDied > 0;
  }

  /**
   * Validates mortality count against live hen count
   * hensDied cannot exceed current liveHenCount
   */
  static isValidAgainstLiveCount(
    hensDied: number,
    liveHenCount: number
  ): boolean {
    return hensDied <= liveHenCount;
  }

  /**
   * Validates mortality date
   * Cannot be in the future
   */
  static isValidDate(dateString: string): boolean {
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
    today.setHours(23, 59, 59, 999); // Allow today

    // Check not in future
    return date <= today && !isNaN(date.getTime());
  }

  /**
   * Validates complete mortality record for creation
   */
  static validateCreate(
    input: CreateMortalityRecordInput,
    liveHenCount: number
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!input.lotId || input.lotId.trim().length === 0) {
      errors.push('El lote es requerido');
    }

    if (!MortalityRecordValidator.isValidDate(input.date)) {
      errors.push('La fecha es inválida o está en el futuro');
    }

    if (!MortalityRecordValidator.isValidHensDied(input.hensDied)) {
      errors.push('La cantidad de gallinas muertas debe ser mayor a 0');
    }

    if (
      !MortalityRecordValidator.isValidAgainstLiveCount(
        input.hensDied,
        liveHenCount
      )
    ) {
      errors.push(
        `La cantidad de gallinas muertas (${input.hensDied}) no puede exceder las gallinas vivas (${liveHenCount})`
      );
    }

    if (!input.recordedBy || input.recordedBy.trim().length === 0) {
      errors.push('El usuario registrador es requerido');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * MortalityRecord factory functions
 */
export class MortalityRecordFactory {
  /**
   * Create a new mortality record object (not persisted)
   */
  static create(
    input: CreateMortalityRecordInput
  ): Omit<MortalityRecord, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      lotId: input.lotId,
      date: input.date,
      hensDied: input.hensDied,
      recordedBy: input.recordedBy,
    };
  }
}

/**
 * MortalityRecord helper functions
 */
export class MortalityRecordHelper {
  /**
   * Check if mortality event is high (>10% of live count)
   * Triggers audit logging when true
   */
  static isHighMortality(hensDied: number, liveHenCount: number): boolean {
    if (liveHenCount === 0) {
      return false;
    }
    const mortalityRate = (hensDied / liveHenCount) * 100;
    return mortalityRate > 10;
  }

  /**
   * Calculate mortality rate as percentage
   */
  static calculateMortalityRate(
    hensDied: number,
    liveHenCount: number
  ): number {
    if (liveHenCount === 0) {
      return 0;
    }
    return (hensDied / liveHenCount) * 100;
  }

  /**
   * Sort mortality records by date (newest first)
   */
  static sortByDate(records: MortalityRecord[]): MortalityRecord[] {
    return [...records].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }

  /**
   * Filter records by date range
   */
  static filterByDateRange(
    records: MortalityRecord[],
    startDate: string,
    endDate: string
  ): MortalityRecord[] {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return records.filter((record) => {
      const recordDate = new Date(record.date).getTime();
      return recordDate >= start && recordDate <= end;
    });
  }

  /**
   * Filter records by lot
   */
  static filterByLot(
    records: MortalityRecord[],
    lotId: string
  ): MortalityRecord[] {
    return records.filter((record) => record.lotId === lotId);
  }

  /**
   * Calculate total mortality for a lot
   */
  static calculateTotalForLot(records: MortalityRecord[]): number {
    return records.reduce((total, record) => total + record.hensDied, 0);
  }

  /**
   * Get mortality statistics for a date range
   */
  static getStatistics(records: MortalityRecord[]): {
    totalRecords: number;
    totalHensDied: number;
    averageHensDiedPerRecord: number;
    highestSingleDayMortality: number;
  } {
    const totalRecords = records.length;
    const totalHensDied = records.reduce(
      (sum, record) => sum + record.hensDied,
      0
    );
    const averageHensDiedPerRecord =
      totalRecords > 0 ? totalHensDied / totalRecords : 0;
    const highestSingleDayMortality =
      records.length > 0
        ? Math.max(...records.map((record) => record.hensDied))
        : 0;

    return {
      totalRecords,
      totalHensDied,
      averageHensDiedPerRecord,
      highestSingleDayMortality,
    };
  }

  /**
   * Format display string for mortality record
   */
  static getDisplayString(record: MortalityRecord): string {
    const date = new Date(record.date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return `${date}: ${record.hensDied} gallina${record.hensDied !== 1 ? 's' : ''}`;
  }
}
