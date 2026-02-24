/**
 * ProductionRecord Model
 *
 * Domain model for production records with validation, business logic, and helper methods.
 * Includes computed field eggsPerHen (eggs collected / live hen count).
 */

import {
  ProductionRecord as ProductionRecordEntity,
  ProductionRecordComputed,
} from '@/shared/types/entities';

/**
 * ProductionRecord type combining entity and computed fields
 */
export type ProductionRecord = ProductionRecordEntity &
  ProductionRecordComputed;

/**
 * Input data for creating a production record
 */
export interface CreateProductionRecordInput {
  lotId: string;
  date: string; // ISO-8601 date (YYYY-MM-DD)
  eggsCollected: number;
  recordedBy: string;
}

/**
 * ProductionRecordValidator
 *
 * Validates production record data and business rules
 */
export class ProductionRecordValidator {
  /**
   * Validates eggs collected is a positive number
   */
  static isValidEggsCollected(eggsCollected: number): boolean {
    return Number.isInteger(eggsCollected) && eggsCollected > 0;
  }

  /**
   * Validates date is not in the future
   */
  static isValidDate(date: string): boolean {
    // Compare only date parts (YYYY-MM-DD), ignore time
    const recordDateStr = date.split('T')[0]; // Handle ISO strings
    const todayStr = new Date().toISOString().split('T')[0];
    return recordDateStr <= todayStr;
  }

  /**
   * Validates date format (YYYY-MM-DD)
   */
  static isValidDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return false;
    }

    // Parse date components
    const [year, month, day] = date.split('-').map(Number);

    // Check valid month
    if (month < 1 || month > 12) {
      return false;
    }

    // Check valid day for month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      return false;
    }

    // Verify the date can be parsed
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }

  /**
   * Validates lot has live hens
   */
  static canRecordProduction(liveHenCount: number): boolean {
    return liveHenCount > 0;
  }

  /**
   * Validates eggs collected is reasonable for the lot size
   * Maximum theoretical production: 1 egg per hen per day
   */
  static isReasonableProduction(
    eggsCollected: number,
    liveHenCount: number
  ): boolean {
    if (liveHenCount === 0) return false;
    const eggsPerHen = eggsCollected / liveHenCount;
    return eggsPerHen <= 1.0; // Cannot exceed 1 egg per hen per day
  }

  /**
   * Validates all creation input
   */
  static validateCreate(input: CreateProductionRecordInput): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!input.lotId || input.lotId.trim() === '') {
      errors.push('Lote es requerido');
    }

    if (!input.date || input.date.trim() === '') {
      errors.push('Fecha es requerida');
    } else {
      if (!this.isValidDateFormat(input.date)) {
        errors.push('Formato de fecha inválido (debe ser YYYY-MM-DD)');
      } else if (!this.isValidDate(input.date)) {
        errors.push('La fecha no puede ser futura');
      }
    }

    if (!this.isValidEggsCollected(input.eggsCollected)) {
      errors.push('Huevos recolectados debe ser un número positivo');
    }

    if (!input.recordedBy || input.recordedBy.trim() === '') {
      errors.push('Usuario que registra es requerido');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * ProductionRecordFactory
 *
 * Creates ProductionRecord instances with proper initialization
 */
export class ProductionRecordFactory {
  /**
   * Creates a new production record entity
   */
  static create(input: CreateProductionRecordInput): ProductionRecordEntity {
    const now = new Date().toISOString();
    return {
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lotId: input.lotId,
      date: input.date,
      eggsCollected: input.eggsCollected,
      recordedBy: input.recordedBy,
      createdAt: now,
      updatedAt: now,
    };
  }
}

/**
 * ProductionRecordHelper
 *
 * Business logic and utility methods for production records
 */
export class ProductionRecordHelper {
  /**
   * Calculates eggs per hen (computed field)
   * Returns 0 if liveHenCount is 0 to avoid division by zero
   */
  static calculateEggsPerHen(
    eggsCollected: number,
    liveHenCount: number
  ): number {
    if (liveHenCount === 0) return 0;
    return Number((eggsCollected / liveHenCount).toFixed(2));
  }

  /**
   * Adds computed field to production record entity
   */
  static addComputedFields(
    record: ProductionRecordEntity,
    liveHenCount: number
  ): ProductionRecord {
    return {
      ...record,
      eggsPerHen: this.calculateEggsPerHen(record.eggsCollected, liveHenCount),
    };
  }

  /**
   * Calculates production efficiency as percentage
   * 100% = 1 egg per hen per day
   */
  static calculateEfficiency(eggsPerHen: number): number {
    return Number((eggsPerHen * 100).toFixed(1));
  }

  /**
   * Determines if production is below expected threshold
   * Expected minimum: 70% efficiency (0.7 eggs per hen)
   */
  static isLowProduction(eggsPerHen: number): boolean {
    return eggsPerHen < 0.7;
  }

  /**
   * Determines if production is optimal
   * Optimal range: 80-95% efficiency (0.8-0.95 eggs per hen)
   */
  static isOptimalProduction(eggsPerHen: number): boolean {
    return eggsPerHen >= 0.8 && eggsPerHen <= 0.95;
  }

  /**
   * Sorts production records by date (most recent first)
   */
  static sortByDate(records: ProductionRecord[]): ProductionRecord[] {
    return [...records].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  /**
   * Filters production records by lot
   */
  static filterByLot(
    records: ProductionRecord[],
    lotId: string
  ): ProductionRecord[] {
    return records.filter((r) => r.lotId === lotId);
  }

  /**
   * Filters production records by date range
   */
  static filterByDateRange(
    records: ProductionRecord[],
    startDate: string,
    endDate: string
  ): ProductionRecord[] {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return records.filter((r) => {
      const recordDate = new Date(r.date).getTime();
      return recordDate >= start && recordDate <= end;
    });
  }

  /**
   * Calculates total eggs collected for a set of records
   */
  static calculateTotalEggs(records: ProductionRecord[]): number {
    return records.reduce((sum, r) => sum + r.eggsCollected, 0);
  }

  /**
   * Calculates average eggs per hen for a set of records
   */
  static calculateAverageEggsPerHen(records: ProductionRecord[]): number {
    if (records.length === 0) return 0;
    const total = records.reduce((sum, r) => sum + r.eggsPerHen, 0);
    return Number((total / records.length).toFixed(2));
  }

  /**
   * Calculates average daily production for a set of records
   */
  static calculateAverageDailyProduction(records: ProductionRecord[]): number {
    if (records.length === 0) return 0;
    const totalEggs = this.calculateTotalEggs(records);
    return Number((totalEggs / records.length).toFixed(0));
  }

  /**
   * Finds the best production day in a set of records
   */
  static findBestDay(records: ProductionRecord[]): ProductionRecord | null {
    if (records.length === 0) return null;
    return records.reduce((best, current) =>
      current.eggsCollected > best.eggsCollected ? current : best
    );
  }

  /**
   * Finds the worst production day in a set of records
   */
  static findWorstDay(records: ProductionRecord[]): ProductionRecord | null {
    if (records.length === 0) return null;
    return records.reduce((worst, current) =>
      current.eggsCollected < worst.eggsCollected ? current : worst
    );
  }

  /**
   * Calculates production statistics for a set of records
   */
  static calculateStatistics(records: ProductionRecord[]): {
    totalEggs: number;
    averageEggsPerHen: number;
    averageDailyProduction: number;
    bestDay: ProductionRecord | null;
    worstDay: ProductionRecord | null;
    totalDays: number;
  } {
    return {
      totalEggs: this.calculateTotalEggs(records),
      averageEggsPerHen: this.calculateAverageEggsPerHen(records),
      averageDailyProduction: this.calculateAverageDailyProduction(records),
      bestDay: this.findBestDay(records),
      worstDay: this.findWorstDay(records),
      totalDays: records.length,
    };
  }

  /**
   * Formats production record for display
   */
  static formatForDisplay(record: ProductionRecord): {
    date: string;
    eggs: string;
    efficiency: string;
    status: 'optimal' | 'low' | 'normal';
  } {
    const efficiency = this.calculateEfficiency(record.eggsPerHen);
    let status: 'optimal' | 'low' | 'normal' = 'normal';

    if (this.isOptimalProduction(record.eggsPerHen)) {
      status = 'optimal';
    } else if (this.isLowProduction(record.eggsPerHen)) {
      status = 'low';
    }

    return {
      date: new Date(record.date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      eggs: `${record.eggsCollected} huevos`,
      efficiency: `${efficiency}%`,
      status,
    };
  }

  /**
   * Groups production records by week
   */
  static groupByWeek(
    records: ProductionRecord[]
  ): Map<string, ProductionRecord[]> {
    const grouped = new Map<string, ProductionRecord[]>();

    records.forEach((record) => {
      const date = new Date(record.date);
      const year = date.getFullYear();
      const week = this.getWeekNumber(date);
      const key = `${year}-W${week.toString().padStart(2, '0')}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(record);
    });

    return grouped;
  }

  /**
   * Gets ISO week number for a date
   */
  private static getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * Groups production records by month
   */
  static groupByMonth(
    records: ProductionRecord[]
  ): Map<string, ProductionRecord[]> {
    const grouped = new Map<string, ProductionRecord[]>();

    records.forEach((record) => {
      const date = new Date(record.date);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(record);
    });

    return grouped;
  }
}
