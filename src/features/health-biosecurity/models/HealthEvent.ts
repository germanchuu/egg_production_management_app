/**
 * HealthEvent Model (T133)
 *
 * Domain model for health events (vaccinations) at lot level.
 */

import { LotEventType } from '@/shared/types/entities';

export interface HealthEvent {
  id: string;
  lotId: string;
  eventType: LotEventType.Vaccination;
  eventDate: string; // YYYY-MM-DD
  productName: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHealthEventInput {
  lotId: string;
  eventDate: string;
  productName: string;
  notes?: string;
  recordedBy: string;
}

export class HealthEventValidator {
  static isValidEventDate(date: string): boolean {
    const dateStr = date.split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    return dateStr <= todayStr;
  }

  static isValidProductName(name: string): boolean {
    return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 200;
  }

  static isValidNotes(notes?: string): boolean {
    if (!notes) return true;
    return notes.length <= 2000;
  }

  static validateCreate(input: CreateHealthEventInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.lotId || input.lotId.trim() === '') {
      errors.push('Debe seleccionar un lote');
    }

    if (!input.eventDate || input.eventDate.trim() === '') {
      errors.push('La fecha del evento es requerida');
    } else if (!this.isValidEventDate(input.eventDate)) {
      errors.push('La fecha del evento no puede ser futura');
    }

    if (!this.isValidProductName(input.productName)) {
      errors.push('El nombre de la vacuna/producto es requerido (máx 200 caracteres)');
    }

    if (!this.isValidNotes(input.notes)) {
      errors.push('Las notas no pueden superar 2000 caracteres');
    }

    return { valid: errors.length === 0, errors };
  }
}
