/**
 * Facilities Validation Schemas
 *
 * Zod validation schemas for chicken houses and lots.
 * Used with react-hook-form for form validation.
 */

import { z } from 'zod';

/**
 * Chicken House validation schema
 */
export const chickenHouseSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
});

export type ChickenHouseFormData = z.infer<typeof chickenHouseSchema>;

/**
 * Chicken Lot validation schema
 */
export const chickenLotSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  chickenHouseId: z.string().min(1, 'Debe seleccionar un galpón'),
  purchaseDate: z
    .string()
    .refine(
      (date) => {
        const purchaseDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return purchaseDate <= today;
      },
      { message: 'La fecha de compra no puede estar en el futuro' }
    ),
  initialHenCount: z
    .number()
    .int('Debe ser un número entero')
    .positive('La cantidad inicial debe ser mayor a 0')
    .min(1, 'Debe haber al menos 1 gallina'),
  ageWeeks: z
    .number()
    .int('Debe ser un número entero')
    .positive('La edad debe ser mayor a 0')
    .max(200, 'La edad no puede exceder 200 semanas'),
});

export type ChickenLotFormData = z.infer<typeof chickenLotSchema>;

/**
 * Validate if chicken house name is unique
 * To be called separately as async validation
 */
export const validateHouseNameUnique = async (
  name: string,
  existingNames: string[]
): Promise<boolean> => {
  const normalizedName = name.trim().toLowerCase();
  return !existingNames.some(
    (existingName) => existingName.trim().toLowerCase() === normalizedName
  );
};
