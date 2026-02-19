import { SQLiteDatabase } from 'expo-sqlite';
import { UserRepository } from './UserRepository';
import { AuditLogRepository } from './AuditLogRepository';
import { ChickenHouseRepository } from './ChickenHouseRepository';
import { ChickenLotRepository } from './ChickenLotRepository';
import { MortalityRecordRepository } from './MortalityRecordRepository';
import { ProductionRecordRepository } from './ProductionRecordRepository';
import { FeedBatchRepository } from './FeedBatchRepository';
import { FeedingRecordRepository } from './FeedingRecordRepository';
import { HealthEventRepository } from './HealthEventRepository';
import { BiosecurityEventRepository } from './BiosecurityEventRepository';

export class RepositoryFactory {
  constructor(private db: SQLiteDatabase) {}

  getUserRepository(): UserRepository {
    return new UserRepository(this.db);
  }

  getAuditLogRepository(): AuditLogRepository {
    return new AuditLogRepository(this.db);
  }

  getChickenHouseRepository(): ChickenHouseRepository {
    return new ChickenHouseRepository(this.db);
  }

  getChickenLotRepository(): ChickenLotRepository {
    return new ChickenLotRepository(this.db);
  }

  getMortalityRecordRepository(): MortalityRecordRepository {
    return new MortalityRecordRepository(this.db);
  }

  getProductionRecordRepository(): ProductionRecordRepository {
    return new ProductionRecordRepository(this.db);
  }

  getFeedBatchRepository(): FeedBatchRepository {
    return new FeedBatchRepository(this.db);
  }

  getFeedingRecordRepository(): FeedingRecordRepository {
    return new FeedingRecordRepository(this.db);
  }

  getHealthEventRepository(): HealthEventRepository {
    return new HealthEventRepository(this.db);
  }

  getBiosecurityEventRepository(): BiosecurityEventRepository {
    return new BiosecurityEventRepository(this.db);
  }
}
