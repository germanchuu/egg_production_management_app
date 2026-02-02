/**
 * Base repository interface for data access operations
 * @template T - The domain entity type
 * @template TCreate - The type for create operations (defaults to Partial<T>)
 * @template TUpdate - The type for update operations (defaults to Partial<T>)
 */
export interface IRepository<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  /**
   * Find an entity by its ID
   * @param id - The entity ID
   * @returns The entity if found, null otherwise
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities
   * @returns Array of all entities
   */
  findAll(): Promise<T[]>;

  /**
   * Create a new entity
   * @param data - The data to create the entity with
   * @returns The created entity
   */
  create(data: TCreate): Promise<T>;

  /**
   * Update an existing entity
   * @param id - The entity ID
   * @param data - The data to update the entity with
   * @returns The updated entity
   */
  update(id: string, data: TUpdate): Promise<T>;

  /**
   * Delete an entity by its ID
   * @param id - The entity ID
   */
  delete(id: string): Promise<void>;

  /**
   * Check if an entity exists by its ID
   * @param id - The entity ID
   * @returns True if the entity exists, false otherwise
   */
  exists(id: string): Promise<boolean>;
}
