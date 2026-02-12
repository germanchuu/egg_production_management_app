/**
 * Production Validation Schemas
 *
 * Zod validation schemas for production records.
 * Used with react-hook-form for form validation.
 */

import { z } from 'zod';
import { ProductionServiceProvider } from '../services/ProductionServiceProvider';

/**
 * Production Record validation schema
 *
 * Note: Custom validations requiring runtime data must be done separately:
 * - Unique lot+date check (requires database query)
 * - Lot has live hens (requires lot data)
 * - Sanity check for excessive production (requires lot data)
 */
export const productionRecordSchema = z.object({
  lotId: z.string().min(1, 'Debe seleccionar un lote'),
  date: z
    .string()
    .refine(
      (date) => {
        // Compare only date parts (YYYY-MM-DD), ignore time
        const recordDateStr = date.split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        return recordDateStr <= todayStr;
      },
      { message: 'La fecha no puede estar en el futuro' }
    ),
  eggsCollected: z
    .number()
    .int('Debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0')
    .min(1, 'Debe haber al menos 1 huevo recolectado'),
});

export type ProductionRecordFormData = z.infer<typeof productionRecordSchema>;

/**
 * Validate lot has live hens for production
 * To be called as custom validation with live data
 */
export const validateLotHasLiveHens = (
  liveHenCount: number
): { valid: boolean; error?: string } => {
  if (liveHenCount <= 0) {
    return {
      valid: false,
      error: 'No se puede registrar producción para un lote sin gallinas vivas',
    };
  }

  return { valid: true };
};

/**
 * Check if eggs collected is reasonable for lot size
 * Maximum theoretical: 1 egg per hen per day
 * Returns validation result with error message if unreasonable
 */
export const validateEggsCollectedIsReasonable = (
  eggsCollected: number,
  liveHenCount: number
): { valid: boolean; error?: string } => {
  if (liveHenCount === 0) {
    return {
      valid: false,
      error: 'El lote no tiene gallinas vivas',
    };
  }

  const eggsPerHen = eggsCollected / liveHenCount;

  // Hard limit: Cannot exceed 1 egg per hen per day
  if (eggsPerHen > 1.0) {
    return {
      valid: false,
      error: `No se puede registrar ${eggsCollected} huevos para ${liveHenCount} gallinas (máximo teórico: ${liveHenCount} huevos/día)`,
    };
  }

  return { valid: true };
};

/**
 * Check if daily total eggs (including existing records) is reasonable
 * Maximum: 2x live hen count per day (allows some buffer for data entry errors)
 * Returns validation result with error message if unreasonable
 *
 * This is the async version that checks against all records for the day.
 */
export async function validateDailyEggsIsReasonable(
  lotId: string,
  date: string,
  eggsCollected: number,
  liveHenCount: number
): Promise<{ valid: boolean; error?: string }> {
  if (liveHenCount === 0) {
    return {
      valid: false,
      error: 'El lote no tiene gallinas vivas',
    };
  }

  try {
    const service = await ProductionServiceProvider.getProductionService();

    // Get existing records for this day
    const result = await service.getProductionByDay(lotId, date);
    const existingTotal =
      result.success && result.data
        ? result.data.reduce((sum: number, r) => sum + r.eggsCollected, 0)
        : 0;

    // Calculate new daily total
    const dailyTotal = existingTotal + eggsCollected;

    // Check if daily total exceeds 2x live hens (hard limit)
    if (dailyTotal > liveHenCount * 2) {
      return {
        valid: false,
        error: `El total del día (${dailyTotal} huevos) excede el límite razonable para ${liveHenCount} gallinas (máximo: ${liveHenCount * 2})`,
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating daily eggs:', error);
    // On error, fall back to single record validation
    return validateEggsCollectedIsReasonable(eggsCollected, liveHenCount);
  }
}

/**
 * Check if production requires sanity check warning
 * Warning threshold: > 2x live hen count (e.g., 200 eggs for 100 hens)
 *
 * Note: This is a warning, not a blocking validation.
 * Used to alert users of potentially incorrect data entry.
 */
export const needsSanityCheckWarning = (
  eggsCollected: number,
  liveHenCount: number
): boolean => {
  if (liveHenCount === 0) {
    return false;
  }
  return eggsCollected > liveHenCount * 2;
};

/**
 * Check if daily total production requires sanity check warning
 * Warning threshold: daily total > 1.5x live hen count
 *
 * This is the async version that checks against all records for the day.
 */
export async function needsDailySanityCheckWarning(
  lotId: string,
  date: string,
  eggsCollected: number,
  liveHenCount: number
): Promise<boolean> {
  if (liveHenCount === 0) {
    return false;
  }

  try {
    const service = await ProductionServiceProvider.getProductionService();

    // Get existing records for this day
    const result = await service.getProductionByDay(lotId, date);
    const existingTotal =
      result.success && result.data
        ? result.data.reduce((sum: number, r) => sum + r.eggsCollected, 0)
        : 0;

    // Calculate new daily total
    const dailyTotal = existingTotal + eggsCollected;

    // Warn if daily total > 1.5x live hens
    return dailyTotal > liveHenCount * 1.5;
  } catch (error) {
    console.error('Error checking daily sanity warning:', error);
    // On error, fall back to single record check
    return needsSanityCheckWarning(eggsCollected, liveHenCount);
  }
}

/**
 * Get sanity check warning message
 */
export const getSanityCheckWarningMessage = (
  eggsCollected: number,
  liveHenCount: number
): string => {
  const eggsPerHen = (eggsCollected / liveHenCount).toFixed(1);
  return `⚠️ Cantidad inusualmente alta: ${eggsCollected} huevos para ${liveHenCount} gallinas (${eggsPerHen} huevos/gallina). Por favor, verifica que la cantidad sea correcta.`;
};

/**
 * Check if production is optimal (80-95% efficiency)
 */
export const isOptimalProduction = (
  eggsCollected: number,
  liveHenCount: number
): boolean => {
  if (liveHenCount === 0) {
    return false;
  }
  const eggsPerHen = eggsCollected / liveHenCount;
  return eggsPerHen >= 0.8 && eggsPerHen <= 0.95;
};

/**
 * Check if production is low (<70% efficiency)
 */
export const isLowProduction = (
  eggsCollected: number,
  liveHenCount: number
): boolean => {
  if (liveHenCount === 0) {
    return false;
  }
  const eggsPerHen = eggsCollected / liveHenCount;
  return eggsPerHen < 0.7;
};

/**
 * Get production status with color indicator
 */
export const getProductionStatus = (
  eggsCollected: number,
  liveHenCount: number
): {
  status: 'optimal' | 'low' | 'normal' | 'warning';
  message: string;
  color: 'success' | 'warning' | 'error' | 'default';
} => {
  if (liveHenCount === 0) {
    return {
      status: 'warning',
      message: 'Lote sin gallinas vivas',
      color: 'error',
    };
  }

  const eggsPerHen = eggsCollected / liveHenCount;
  const efficiency = (eggsPerHen * 100).toFixed(0);

  if (needsSanityCheckWarning(eggsCollected, liveHenCount)) {
    return {
      status: 'warning',
      message: `${efficiency}% - Cantidad inusualmente alta`,
      color: 'warning',
    };
  }

  if (isOptimalProduction(eggsCollected, liveHenCount)) {
    return {
      status: 'optimal',
      message: `${efficiency}% - Producción óptima`,
      color: 'success',
    };
  }

  if (isLowProduction(eggsCollected, liveHenCount)) {
    return {
      status: 'low',
      message: `${efficiency}% - Producción baja`,
      color: 'warning',
    };
  }

  return {
    status: 'normal',
    message: `${efficiency}% - Producción normal`,
    color: 'default',
  };
};
