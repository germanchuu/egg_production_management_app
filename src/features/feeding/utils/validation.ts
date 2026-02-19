/**
 * Feeding Validation Schemas (T122)
 *
 * Zod validation schemas for feed batches and feeding records.
 * Used with react-hook-form for form validation.
 */

import { z } from 'zod';

/**
 * Feed Batch validation schema
 *
 * Rules:
 * - batchName: required
 * - preparationDate: required, not in the future
 * - quantityKg: required, > 0
 */
export const feedBatchSchema = z.object({
  batchName: z.string().min(1, 'El nombre del lote de alimento es requerido'),
  preparationDate: z
    .string()
    .min(1, 'La fecha de preparación es requerida')
    .refine(
      (date) => {
        const dateStr = date.split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        return dateStr <= todayStr;
      },
      { message: 'La fecha de preparación no puede estar en el futuro' }
    ),
  quantityKg: z
    .number()
    .positive('La cantidad debe ser mayor a 0')
    .finite('La cantidad debe ser un número válido'),
});

export type FeedBatchFormData = z.infer<typeof feedBatchSchema>;

/**
 * Feeding Record validation schema
 *
 * Rules:
 * - lotId: required
 * - feedBatchId: required
 * - date: required, not in the future
 * - quantityFedKg: required, > 0
 */
export const feedingRecordSchema = z.object({
  lotId: z.string().min(1, 'Debe seleccionar un lote'),
  feedBatchId: z.string().min(1, 'Debe seleccionar un lote de alimento'),
  date: z
    .string()
    .min(1, 'La fecha es requerida')
    .refine(
      (date) => {
        const dateStr = date.split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        return dateStr <= todayStr;
      },
      { message: 'La fecha no puede estar en el futuro' }
    ),
  quantityFedKg: z
    .number()
    .positive('La cantidad suministrada debe ser mayor a 0')
    .finite('La cantidad debe ser un número válido'),
});

export type FeedingRecordFormData = z.infer<typeof feedingRecordSchema>;

/**
 * Validate that feeding quantity does not exceed batch remaining
 * Returns a warning (not blocking) per T123
 */
export const validateFeedingQuantityVsRemaining = (
  quantityFedKg: number,
  remainingKg: number
): { valid: boolean; warning?: string } => {
  if (quantityFedKg > remainingKg) {
    return {
      valid: true, // Not blocking, just a warning
      warning: `La cantidad (${quantityFedKg.toFixed(2)} kg) supera el disponible en el lote (${remainingKg.toFixed(2)} kg)`,
    };
  }

  return { valid: true };
};

/**
 * Validate lot has live hens for feeding
 */
export const validateLotHasLiveHens = (
  liveHenCount: number
): { valid: boolean; error?: string } => {
  if (liveHenCount <= 0) {
    return {
      valid: false,
      error: 'No se puede registrar alimentación para un lote sin gallinas vivas',
    };
  }

  return { valid: true };
};
