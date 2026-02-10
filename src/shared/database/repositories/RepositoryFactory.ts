import { SQLiteDatabase } from 'expo-sqlite';
import { UserRepository } from './UserRepository';
import { AuditLogRepository } from './AuditLogRepository';

export class RepositoryFactory {
  constructor(private db: SQLiteDatabase) {}

  getUserRepository(): UserRepository {
    return new UserRepository(this.db);
  }

  getAuditLogRepository(): AuditLogRepository {
    return new AuditLogRepository(this.db);
  }
}
