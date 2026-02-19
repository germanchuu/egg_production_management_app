/**
 * FeedingRecord Model (T119)
 *
 * Domain model for daily feeding records with computed field feedPerHen.
 * Represents the amount of feed given to a chicken lot on a specific day.
 */

import {
  FeedingRecord as FeedingRecordEntity,
  FeedingRecordComputed,
} from '@/shared/types/entities';

/**
 * FeedingRecord type combining entity and computed fields
 */
export type FeedingRecord = FeedingRecordEntity & FeedingRecordComputed;

/**
 * Input data for creating a feeding record
 */
export interface CreateFeedingRecordInput {
  lotId: string;
  feedBatchId: string;
  date: string; // ISO-8601 date (YYYY-MM-DD)
  quantityFedKg: number;
  recordedBy: string;
}

/**
 * FeedingRecordValidator
 *
 * Validates feeding record data and business rules
 */
export class FeedingRecordValidator {
  /**
   * Validates feeding date is not in the future
   */
  static isValidDate(date: string): boolean {
    const dateStr = date.split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    return dateStr <= todayStr;
  }

  /**
   * Validates quantity fed is a positive decimal
   */
  static isValidQuantityFedKg(quantity: number): boolean {
    return typeof quantity === 'number' && quantity > 0 && isFinite(quantity);
  }

  /**
   * Validates all creation input
   */
  static validateCreate(input: CreateFeedingRecordInput): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!input.lotId || input.lotId.trim() === '') {
      errors.push('Lote es requerido');
    }

    if (!input.feedBatchId || input.feedBatchId.trim() === '') {
      errors.push('Lote de alimento es requerido');
    }

    if (!input.date || input.date.trim() === '') {
      errors.push('Fecha es requerida');
    } else if (!this.isValidDate(input.date)) {
      errors.push('La fecha no puede ser futura');
    }

    if (!this.isValidQuantityFedKg(input.quantityFedKg)) {
      errors.push('Cantidad suministrada (kg) debe ser un número positivo');
    }

    if (!input.recordedBy || input.recordedBy.trim() === '') {
      errors.push('Usuario que registra es requerido');
    }

    return { valid: errors.length === 0, errors };
  }
}

/**
 * FeedingRecordFactory
 *
 * Creates FeedingRecord instances with proper initialization
 */
export class FeedingRecordFactory {
  /**
   * Creates a new feeding record entity
   */
  static create(input: CreateFeedingRecordInput): FeedingRecordEntity {
    const now = new Date().toISOString();
    return {
      id: `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lotId: input.lotId,
      feedBatchId: input.feedBatchId,
      date: input.date,
      quantityFedKg: Number(input.quantityFedKg.toFixed(2)),
      recordedBy: input.recordedBy,
      createdAt: now,
      updatedAt: now,
    };
  }
}

/**
 * FeedingRecordHelper
 *
 * Business logic and computed fields for feeding records
 */
export class FeedingRecordHelper {
  /**
   * Calculates feed per hen (computed field)
   * Returns 0 if liveHenCount is 0 to avoid division by zero
   *
   * @param quantityFedKg - Total feed given
   * @param liveHenCount - Number of live hens in the lot
   */
  static calculateFeedPerHen(
    quantityFedKg: number,
    liveHenCount: number
  ): number {
    if (liveHenCount === 0) return 0;
    return Number((quantityFedKg / liveHenCount).toFixed(4));
  }

  /**
   * Adds computed fields to a feeding record entity
   */
  static addComputedFields(
    record: FeedingRecordEntity,
    liveHenCount: number
  ): FeedingRecord {
    return {
      ...record,
      feedPerHen: this.calculateFeedPerHen(record.quantityFedKg, liveHenCount),
    };
  }

  /**
   * Calculates total feed consumed from a list of records
   */
  static calculateTotalFeedConsumed(records: FeedingRecord[]): number {
    return Number(
      records.reduce((sum, r) => sum + r.quantityFedKg, 0).toFixed(2)
    );
  }

  /**
   * Calculates average feed per hen across multiple records
   */
  static calculateAverageFeedPerHen(records: FeedingRecord[]): number {
    if (records.length === 0) return 0;
    const total = records.reduce((sum, r) => sum + r.feedPerHen, 0);
    return Number((total / records.length).toFixed(4));
  }

  /**
   * Sorts feeding records by date (most recent first)
   */
  static sortByDate(records: FeedingRecord[]): FeedingRecord[] {
    return [...records].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
}
