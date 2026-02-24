import { ChickenHouse } from '@/shared/types/entities';

/**
 * Builder pattern for creating ChickenHouse test fixtures
 *
 * Usage:
 *   const house = new ChickenHouseBuilder().withName('Galpón A').build();
 */
export class ChickenHouseBuilder {
  private house: ChickenHouse = {
    id: `house-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test House',
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  withId(id: string): this {
    this.house.id = id;
    return this;
  }

  withName(name: string): this {
    this.house.name = name;
    return this;
  }

  withDescription(description: string): this {
    this.house.description = description;
    return this;
  }

  withCreatedBy(userId: string): this {
    this.house.createdBy = userId;
    return this;
  }

  build(): ChickenHouse {
    return { ...this.house };
  }
}
