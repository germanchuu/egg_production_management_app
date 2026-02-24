import { ChickenLot } from '@/shared/types/entities';

/**
 * Builder pattern for creating ChickenLot test fixtures
 *
 * Usage:
 *   const lot = new ChickenLotBuilder().withLiveHens(950).build();
 */
export class ChickenLotBuilder {
  private lot: ChickenLot = {
    id: `lot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Lot',
    chickenHouseId: 'house-1',
    purchaseDate: new Date('2024-01-01').toISOString().split('T')[0],
    initialHenCount: 1000,
    liveHenCount: 1000,
    ageWeeks: 18,
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  withId(id: string): this {
    this.lot.id = id;
    return this;
  }

  withName(name: string): this {
    this.lot.name = name;
    return this;
  }

  withChickenHouseId(chickenHouseId: string): this {
    this.lot.chickenHouseId = chickenHouseId;
    return this;
  }

  withPurchaseDate(purchaseDate: string): this {
    this.lot.purchaseDate = purchaseDate;
    return this;
  }

  withInitialHens(count: number): this {
    this.lot.initialHenCount = count;
    this.lot.liveHenCount = count;
    return this;
  }

  withLiveHens(count: number): this {
    this.lot.liveHenCount = count;
    return this;
  }

  withAgeWeeks(weeks: number): this {
    this.lot.ageWeeks = weeks;
    return this;
  }

  withCreatedBy(userId: string): this {
    this.lot.createdBy = userId;
    return this;
  }

  build(): ChickenLot {
    return { ...this.lot };
  }
}
