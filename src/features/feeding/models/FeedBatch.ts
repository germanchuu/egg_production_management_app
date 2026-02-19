/**
 * FeedBatch Model (T118)
 *
 * Domain model for feed batches with computed field remainingQuantityKg.
 * A feed batch represents a prepared batch of feed available for chicken lots.
 */

import {
  FeedBatch as FeedBatchEntity,
  FeedBatchComputed,
} from '@/shared/types/entities';

/**
 * FeedBatch type combining entity and computed fields
 */
export type FeedBatch = FeedBatchEntity & FeedBatchComputed;

/**
 * Input data for creating a feed batch
 */
export interface CreateFeedBatchInput {
  batchName: string;
  preparationDate: string; // ISO-8601 date (YYYY-MM-DD)
  quantityKg: number;
  preparedBy: string;
}

/**
 * FeedBatchValidator
 *
 * Validates feed batch data and business rules
 */
export class FeedBatchValidator {
  /**
   * Validates batch name is not empty
   */
  static isValidBatchName(name: string): boolean {
    return typeof name === 'string' && name.trim().length > 0;
  }

  /**
   * Validates preparation date is not in the future
   */
  static isValidPreparationDate(date: string): boolean {
    const dateStr = date.split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    return dateStr <= todayStr;
  }

  /**
   * Validates quantity is a positive decimal number
   */
  static isValidQuantityKg(quantity: number): boolean {
    return typeof quantity === 'number' && quantity > 0 && isFinite(quantity);
  }

  /**
   * Validates all creation input
   */
  static validateCreate(input: CreateFeedBatchInput): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!this.isValidBatchName(input.batchName)) {
      errors.push('Nombre del lote de alimento es requerido');
    }

    if (!input.preparationDate || input.preparationDate.trim() === '') {
      errors.push('Fecha de preparación es requerida');
    } else if (!this.isValidPreparationDate(input.preparationDate)) {
      errors.push('La fecha de preparación no puede ser futura');
    }

    if (!this.isValidQuantityKg(input.quantityKg)) {
      errors.push('Cantidad (kg) debe ser un número positivo');
    }

    if (!input.preparedBy || input.preparedBy.trim() === '') {
      errors.push('Usuario que prepara es requerido');
    }

    return { valid: errors.length === 0, errors };
  }
}

/**
 * FeedBatchFactory
 *
 * Creates FeedBatch instances with proper initialization
 */
export class FeedBatchFactory {
  /**
   * Creates a new feed batch entity
   */
  static create(input: CreateFeedBatchInput): FeedBatchEntity {
    const now = new Date().toISOString();
    return {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      batchName: input.batchName.trim(),
      preparationDate: input.preparationDate,
      quantityKg: Number(input.quantityKg.toFixed(2)),
      preparedBy: input.preparedBy,
      createdAt: now,
      updatedAt: now,
    };
  }
}

/**
 * FeedBatchHelper
 *
 * Business logic and computed fields for feed batches
 */
export class FeedBatchHelper {
  /**
   * Calculates remaining quantity after all feedings
   *
   * @param totalQuantityKg - Total batch quantity
   * @param totalFedKg - Total quantity already fed
   * @returns Remaining quantity (clamped to 0)
   */
  static calculateRemainingQuantityKg(
    totalQuantityKg: number,
    totalFedKg: number
  ): number {
    const remaining = totalQuantityKg - totalFedKg;
    return Number(Math.max(0, remaining).toFixed(2));
  }

  /**
   * Adds computed fields to a feed batch entity
   */
  static addComputedFields(
    batch: FeedBatchEntity,
    totalFedKg: number
  ): FeedBatch {
    return {
      ...batch,
      remainingQuantityKg: this.calculateRemainingQuantityKg(
        batch.quantityKg,
        totalFedKg
      ),
    };
  }

  /**
   * Determines if a batch is exhausted (remaining ≤ 0)
   */
  static isExhausted(batch: FeedBatch): boolean {
    return batch.remainingQuantityKg <= 0;
  }

  /**
   * Warns if feeding quantity would exceed remaining batch quantity
   */
  static wouldExceedRemaining(
    quantityFedKg: number,
    remainingKg: number
  ): boolean {
    return quantityFedKg > remainingKg;
  }

  /**
   * Formats quantity for display (2 decimal places)
   */
  static formatQuantity(kg: number): string {
    return `${kg.toFixed(2)} kg`;
  }
}
