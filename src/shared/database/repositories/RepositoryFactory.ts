import { SQLiteDatabase } from 'expo-sqlite';
import { UserRepository } from './UserRepository';
import { AuditLogRepository } from './AuditLogRepository';
import { ChickenHouseRepository } from './ChickenHouseRepository';
import { ChickenLotRepository } from './ChickenLotRepository';
import { MortalityRecordRepository } from './MortalityRecordRepository';

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
}
