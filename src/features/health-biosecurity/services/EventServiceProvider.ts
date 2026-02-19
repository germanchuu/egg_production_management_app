/**
 * EventService Provider
 *
 * Factory for EventService with dependency injection.
 */

import { EventService } from './EventService';
import { RepositoryFactory } from '@/shared/database/repositories';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { getDatabase } from '@/shared/database';

export class EventServiceProvider {
  static async getEventService(): Promise<EventService> {
    const db = getDatabase();
    const factory = new RepositoryFactory(db);

    return new EventService(
      factory.getHealthEventRepository(),
      factory.getBiosecurityEventRepository(),
      factory.getChickenLotRepository(),
      new SyncQueue(db)
    );
  }
}
