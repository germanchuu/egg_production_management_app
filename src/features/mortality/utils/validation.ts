/**
 * Mortality Validation Schemas
 *
 * Zod validation schemas for mortality records.
 * Used with react-hook-form for form validation.
 */

import { z } from 'zod';

/**
 * Mortality Record validation schema
 *
 * Note: hensDied validation against liveHenCount must be done
 * separately as custom validation since it requires runtime data
 */
export const mortalityRecordSchema = z.object({
  lotId: z.string().min(1, 'Debe seleccionar un lote'),
  date: z
    .string()
    .refine(
      (date) => {
        const mortalityDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Allow today
        return mortalityDate <= today;
      },
      { message: 'La fecha no puede estar en el futuro' }
    ),
  hensDied: z
    .number()
    .int('Debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0')
    .min(1, 'Debe haber al menos 1 gallina muerta'),
});

export type MortalityRecordFormData = z.infer<typeof mortalityRecordSchema>;

/**
 * Validate hensDied against current live hen count
 * To be called as custom validation with live data
 */
export const validateHensDiedAgainstLiveCount = (
  hensDied: number,
  liveHenCount: number
): { valid: boolean; error?: string } => {
  if (hensDied > liveHenCount) {
    return {
      valid: false,
      error: `No se puede registrar ${hensDied} gallinas muertas cuando solo hay ${liveHenCount} gallinas vivas`,
    };
  }

  return { valid: true };
};

/**
 * Check if mortality is high (>10%)
 */
export const isHighMortality = (
  hensDied: number,
  liveHenCount: number
): boolean => {
  if (liveHenCount === 0) {
    return false;
  }
  const mortalityRate = (hensDied / liveHenCount) * 100;
  return mortalityRate > 10;
};
