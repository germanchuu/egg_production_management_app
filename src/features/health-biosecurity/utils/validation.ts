/**
 * Health & Biosecurity Validation Schemas (T137)
 *
 * Zod schemas for health and biosecurity event forms.
 * Rules: eventDate not future, productName required (max 200), notes max 2000.
 */

import { z } from 'zod';

const notFutureDate = z
  .string()
  .min(1, 'La fecha del evento es requerida')
  .refine(
    (date) => {
      const dateStr = date.split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      return dateStr <= todayStr;
    },
    { message: 'La fecha del evento no puede estar en el futuro' }
  );

/**
 * Health event form schema (vaccination)
 */
export const healthEventSchema = z.object({
  lotId: z.string().min(1, 'Debe seleccionar un lote'),
  eventDate: notFutureDate,
  productName: z
    .string()
    .min(1, 'El nombre de la vacuna/producto es requerido')
    .max(200, 'El nombre no puede superar 200 caracteres'),
  notes: z
    .string()
    .max(2000, 'Las notas no pueden superar 2000 caracteres')
    .optional(),
});

export type HealthEventFormData = z.infer<typeof healthEventSchema>;

/**
 * Biosecurity event form schema (disinfection)
 */
export const biosecurityEventSchema = z.object({
  eventDate: notFutureDate,
  productName: z
    .string()
    .min(1, 'El nombre del producto desinfectante es requerido')
    .max(200, 'El nombre no puede superar 200 caracteres'),
  notes: z
    .string()
    .max(2000, 'Las notas no pueden superar 2000 caracteres')
    .optional(),
});

export type BiosecurityEventFormData = z.infer<typeof biosecurityEventSchema>;
