/**
 * Auth Feature Validation Schemas
 *
 * Zod schemas for validating user and invitation data
 */

import { z } from 'zod';
import { UserRole } from '@/shared/types/entities';

/**
 * User creation schema
 */
export const createUserSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(100, { message: 'El nombre no puede exceder 100 caracteres' })
    .trim(),
  role: z.nativeEnum(UserRole),
});

/**
 * User update schema
 */
export const updateUserSchema = z.object({
  id: z.string().uuid({ message: 'ID de usuario inválido' }),
  displayName: z
    .string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(100, { message: 'El nombre no puede exceder 100 caracteres' })
    .trim()
    .optional(),
  role: z.nativeEnum(UserRole).optional(),
});

/**
 * Invitation token schema
 */
export const invitationTokenSchema = z
  .string()
  .min(10, { message: 'Token de invitación inválido' })
  .max(500, { message: 'Token de invitación inválido' });

/**
 * Device ID schema
 */
export const deviceIdSchema = z
  .string()
  .uuid({ message: 'ID de dispositivo inválido' });

/**
 * Device name schema
 */
export const deviceNameSchema = z
  .string()
  .min(1, { message: 'Nombre de dispositivo requerido' })
  .max(100, { message: 'Nombre de dispositivo muy largo' });
