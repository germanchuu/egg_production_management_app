import { ProductionRecord } from '@/shared/types/entities';

/**
 * Builder pattern for creating ProductionRecord test fixtures
 *
 * Usage:
 *   const record = new ProductionRecordBuilder().withEggs(850).build();
 */
export class ProductionRecordBuilder {
  private record: ProductionRecord = {
    id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    lotId: 'lot-1',
    date: new Date().toISOString().split('T')[0],
    eggsCollected: 850,
    recordedBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  withId(id: string): this {
    this.record.id = id;
    return this;
  }

  withLotId(lotId: string): this {
    this.record.lotId = lotId;
    return this;
  }

  withDate(date: string): this {
    this.record.date = date;
    return this;
  }

  withEggs(eggsCollected: number): this {
    this.record.eggsCollected = eggsCollected;
    return this;
  }

  withRecordedBy(userId: string): this {
    this.record.recordedBy = userId;
    return this;
  }

  build(): ProductionRecord {
    return { ...this.record };
  }
}
