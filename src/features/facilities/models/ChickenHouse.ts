/**
 * ChickenHouse Model
 *
 * Represents physical chicken houses/coops where chicken lots are housed.
 * Houses are registered by administrators and contain multiple lots over time.
 *
 * Business Rules:
 * - House names must be unique
 * - Only administrators can create/delete houses
 * - Houses can be empty (no active lots)
 * - Description is optional
 *
 * This model extends the shared ChickenHouse entity type with
 * facilities-specific business logic and validation.
 */

import { ChickenHouse as ChickenHouseEntity } from '@/shared/types/entities';

/**
 * ChickenHouse model interface (extends shared entity)
 */
export type ChickenHouse = ChickenHouseEntity;

/**
 * ChickenHouse creation input
 */
export interface CreateChickenHouseInput {
  name: string;
  description?: string;
  createdBy: string;
}

/**
 * ChickenHouse update input
 */
export interface UpdateChickenHouseInput {
  name?: string;
  description?: string;
}

/**
 * ChickenHouse validation helper functions
 */
export class ChickenHouseValidator {
  /**
   * Validates house name
   * Name must be between 1 and 100 characters
   */
  static isValidName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }
    const trimmed = name.trim();
    return trimmed.length >= 1 && trimmed.length <= 100;
  }

  /**
   * Validates description
   * Description is optional but max 500 characters
   */
  static isValidDescription(description: string | undefined): boolean {
    if (description === undefined || description === null) {
      return true; // Optional field
    }
    if (typeof description !== 'string') {
      return false;
    }
    return description.length <= 500;
  }

  /**
   * Validates complete house data for creation
   */
  static validateCreate(input: CreateChickenHouseInput): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!ChickenHouseValidator.isValidName(input.name)) {
      errors.push('El nombre del galpón es requerido (1-100 caracteres)');
    }

    if (!ChickenHouseValidator.isValidDescription(input.description)) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }

    if (!input.createdBy || input.createdBy.trim().length === 0) {
      errors.push('El usuario creador es requerido');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates update data
   */
  static validateUpdate(input: UpdateChickenHouseInput): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (input.name !== undefined && !ChickenHouseValidator.isValidName(input.name)) {
      errors.push('El nombre del galpón debe tener entre 1 y 100 caracteres');
    }

    if (input.description !== undefined && !ChickenHouseValidator.isValidDescription(input.description)) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * ChickenHouse factory functions
 */
export class ChickenHouseFactory {
  /**
   * Create a new chicken house object (not persisted)
   *
   * @param input - House creation input
   * @returns Partial house object ready for persistence
   */
  static create(
    input: CreateChickenHouseInput
  ): Omit<ChickenHouse, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: input.name.trim(),
      description: input.description?.trim(),
      createdBy: input.createdBy,
    };
  }

  /**
   * Create display name for house (used in UI)
   * Returns name with description if available
   */
  static getDisplayName(house: ChickenHouse): string {
    if (house.description) {
      return `${house.name} - ${house.description}`;
    }
    return house.name;
  }
}

/**
 * ChickenHouse helper functions
 */
export class ChickenHouseHelper {
  /**
   * Check if house name is available (not duplicate)
   * This should be called before creating a new house
   *
   * @param name - Proposed house name
   * @param existingHouses - List of existing houses
   * @returns True if name is available
   */
  static isNameAvailable(name: string, existingHouses: ChickenHouse[]): boolean {
    const normalizedName = name.trim().toLowerCase();
    return !existingHouses.some(
      (house) => house.name.trim().toLowerCase() === normalizedName
    );
  }

  /**
   * Sort houses by name alphabetically
   */
  static sortByName(houses: ChickenHouse[]): ChickenHouse[] {
    return [...houses].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  /**
   * Sort houses by creation date (newest first)
   */
  static sortByCreatedDate(houses: ChickenHouse[]): ChickenHouse[] {
    return [...houses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Filter houses by search term (name or description)
   */
  static filterBySearchTerm(
    houses: ChickenHouse[],
    searchTerm: string
  ): ChickenHouse[] {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return houses;
    }

    const term = searchTerm.trim().toLowerCase();
    return houses.filter(
      (house) =>
        house.name.toLowerCase().includes(term) ||
        house.description?.toLowerCase().includes(term)
    );
  }
}
