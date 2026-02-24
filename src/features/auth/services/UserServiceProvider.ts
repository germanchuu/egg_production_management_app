import { getDatabase } from '@/shared/database';
import { RepositoryFactory } from '@/shared/database/repositories';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { UserService } from './UserService';

export class UserServiceProvider {
  static async getUserService(): Promise<UserService> {
    const db = getDatabase();
    const factory = new RepositoryFactory(db);
    const userRepository = factory.getUserRepository();
    const syncQueue = new SyncQueue(db);

    return new UserService(userRepository, syncQueue);
  }
}
