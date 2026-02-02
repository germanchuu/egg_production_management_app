import { SQLiteDatabase } from 'expo-sqlite';
import { UserRepository } from './UserRepository';

export class RepositoryFactory {
  constructor(private db: SQLiteDatabase) {}

  getUserRepository(): UserRepository {
    return new UserRepository(this.db);
  }
}
