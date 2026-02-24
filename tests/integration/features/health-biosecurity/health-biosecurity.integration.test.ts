/**
 * Health & Biosecurity Integration Tests (T144, T145, T146)
 *
 * Tests for User Story 5 — Health & Biosecurity Event Tracking
 * Validates offline event recording with sync, multi-line notes,
 * and chronological ordering of event history.
 *
 * Test Scenarios:
 * - T144: Offline health/biosecurity event recording with sync queue
 * - T145: Multi-line notes stored and retrieved correctly
 * - T146: Event history displayed in chronological descending order
 */

import * as SQLite from 'expo-sqlite';
import { EventService } from '@/features/health-biosecurity/services/EventService';
import { HealthEventRepository } from '@/shared/database/repositories/HealthEventRepository';
import { BiosecurityEventRepository } from '@/shared/database/repositories/BiosecurityEventRepository';
import { ChickenLotRepository } from '@/shared/database/repositories/ChickenLotRepository';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import {
  createTestDatabase,
  cleanupTestDatabase,
  seedTestData,
} from '../../../utils/testDatabase';

// ─── Mock Firebase ───────────────────────────────────────────────────────────

const mockCollection = jest.fn();
const mockDoc        = jest.fn();
const mockGetDoc     = jest.fn();
const mockSetDoc     = jest.fn();
const mockDeleteDoc  = jest.fn();
const mockQuery      = jest.fn();
const mockWhere      = jest.fn();
const mockGetDocs    = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc:        (...args: any[]) => mockDoc(...args),
  getDoc:     (...args: any[]) => mockGetDoc(...args),
  setDoc:     (...args: any[]) => mockSetDoc(...args),
  deleteDoc:  (...args: any[]) => mockDeleteDoc(...args),
  query:      (...args: any[]) => mockQuery(...args),
  where:      (...args: any[]) => mockWhere(...args),
  getDocs:    (...args: any[]) => mockGetDocs(...args),
}));

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('Health & Biosecurity Integration Tests', () => {
  let db: SQLite.SQLiteDatabase;
  let eventService: EventService;
  let syncQueue: SyncQueue;

  const testUserId  = 'test-user-1';
  const testHouseId = 'test-house-1';
  const testLotId   = 'test-lot-1';
  const today       = new Date().toISOString().split('T')[0];

  beforeEach(async () => {
    db = await createTestDatabase();

    const healthEventRepo     = new HealthEventRepository(db);
    const biosecurityEventRepo = new BiosecurityEventRepository(db);
    const lotRepo             = new ChickenLotRepository(db);
    syncQueue                 = new SyncQueue(db);

    eventService = new EventService(
      healthEventRepo,
      biosecurityEventRepo,
      lotRepo,
      syncQueue
    );

    const now = new Date().toISOString();
    await seedTestData(db, {
      users: [
        {
          id:           testUserId,
          display_name: 'Test User',
          role:         'user',
          auth_status:  'authenticated',
          created_at:   now,
          updated_at:   now,
          is_active:    1,
        },
      ],
      chicken_houses: [
        {
          id:          testHouseId,
          name:        'Test House',
          description: 'Test house',
          created_by:  testUserId,
          created_at:  now,
          updated_at:  now,
        },
      ],
      chicken_lots: [
        {
          id:                testLotId,
          name:              'Test Lot',
          chicken_house_id:  testHouseId,
          purchase_date:     '2024-01-01',
          initial_hen_count: 100,
          live_hen_count:    100,
          age_weeks:         20,
          created_by:        testUserId,
          created_at:        now,
          updated_at:        now,
        },
      ],
    });

    jest.clearAllMocks();
    mockCollection.mockReturnValue('mock-collection-ref');
    mockDoc.mockReturnValue('mock-doc-ref');
    mockSetDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => null });
    mockWhere.mockReturnValue('mock-where');
    mockQuery.mockReturnValue('mock-query');
    mockGetDocs.mockResolvedValue({ docs: [], empty: true });
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
  });

  // ─── T144: Offline event recording with sync ──────────────────────────────

  describe('T144 - Offline health and biosecurity event recording', () => {
    it('records a health event offline and persists in SQLite', async () => {
      const result = await eventService.recordHealthEvent({
        lotId:       testLotId,
        eventDate:   today,
        productName: 'Vacuna Newcastle',
        notes:       'Primera dosis',
        recordedBy:  testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.data?.productName).toBe('Vacuna Newcastle');
      expect(result.data?.eventType).toBe('vaccination');
      expect(result.data?.lotId).toBe(testLotId);

      const row = await db.getFirstAsync<any>(
        'SELECT * FROM health_events WHERE id = ?',
        [result.data!.id]
      );
      expect(row).not.toBeNull();
      expect(row.product_name).toBe('Vacuna Newcastle');
      expect(row.lot_id).toBe(testLotId);
    });

    it('enqueues health event for sync after offline recording', async () => {
      const result = await eventService.recordHealthEvent({
        lotId:       testLotId,
        eventDate:   today,
        productName: 'Vacuna Marek',
        recordedBy:  testUserId,
      });

      expect(result.success).toBe(true);

      const pending = await db.getAllAsync<any>(
        "SELECT * FROM sync_queue WHERE entity_type = 'health_events' AND entity_id = ?",
        [result.data!.id]
      );
      expect(pending.length).toBe(1);
      expect(pending[0].operation).toBe('CREATE');
    });

    it('records a biosecurity event offline and persists in SQLite', async () => {
      const result = await eventService.recordBiosecurityEvent({
        eventDate:   today,
        productName: 'Formaldehido 10%',
        notes:       'Desinfección mensual de galpones',
        recordedBy:  testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.data?.productName).toBe('Formaldehido 10%');
      expect(result.data?.eventType).toBe('disinfection');

      const row = await db.getFirstAsync<any>(
        'SELECT * FROM biosecurity_events WHERE id = ?',
        [result.data!.id]
      );
      expect(row).not.toBeNull();
      expect(row.product_name).toBe('Formaldehido 10%');
      // farm-level: no lot_id column
      expect(row.lot_id).toBeUndefined();
    });

    it('enqueues biosecurity event for sync after offline recording', async () => {
      const result = await eventService.recordBiosecurityEvent({
        eventDate:   today,
        productName: 'Cloro 2%',
        recordedBy:  testUserId,
      });

      expect(result.success).toBe(true);

      const pending = await db.getAllAsync<any>(
        "SELECT * FROM sync_queue WHERE entity_type = 'biosecurity_events' AND entity_id = ?",
        [result.data!.id]
      );
      expect(pending.length).toBe(1);
      expect(pending[0].operation).toBe('CREATE');
    });

    it('returns error when lot does not exist for health event', async () => {
      const result = await eventService.recordHealthEvent({
        lotId:       'nonexistent-lot',
        eventDate:   today,
        productName: 'Vacuna Test',
        recordedBy:  testUserId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('lote no existe');
    });

    it('returns error when event date is in the future', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      const result = await eventService.recordHealthEvent({
        lotId:       testLotId,
        eventDate:   futureDate,
        productName: 'Vacuna Futura',
        recordedBy:  testUserId,
      });

      expect(result.success).toBe(false);
    });
  });

  // ─── T145: Multi-line notes support ──────────────────────────────────────

  describe('T145 - Multi-line notes stored and retrieved correctly', () => {
    it('stores multi-line notes for health events', async () => {
      const multiLineNotes = [
        'Dosis aplicada: 0.5 ml por gallina',
        'Lote de vacuna: VNC-2024-001',
        'Temperatura de conservación: 2-8°C',
        'Observaciones: Sin reacciones adversas',
      ].join('\n');

      const result = await eventService.recordHealthEvent({
        lotId:       testLotId,
        eventDate:   today,
        productName: 'Vacuna Newcastle DL-76',
        notes:       multiLineNotes,
        recordedBy:  testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.data?.notes).toBe(multiLineNotes);

      // Verify persisted exactly, including newlines
      const row = await db.getFirstAsync<any>(
        'SELECT notes FROM health_events WHERE id = ?',
        [result.data!.id]
      );
      expect(row.notes).toBe(multiLineNotes);
      expect(row.notes).toContain('\n');
    });

    it('stores multi-line notes for biosecurity events', async () => {
      const multiLineNotes = [
        'Producto: Glutaraldehído 2%',
        'Dilución: 1:200 en agua',
        'Áreas tratadas: Galpones 1, 2 y 3',
        'Tiempo de contacto: 30 minutos',
        'Responsable: Juan Pérez',
      ].join('\n');

      const result = await eventService.recordBiosecurityEvent({
        eventDate:   today,
        productName: 'Glutaraldehído',
        notes:       multiLineNotes,
        recordedBy:  testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.data?.notes).toBe(multiLineNotes);

      const row = await db.getFirstAsync<any>(
        'SELECT notes FROM biosecurity_events WHERE id = ?',
        [result.data!.id]
      );
      expect(row.notes).toBe(multiLineNotes);
      expect(row.notes.split('\n').length).toBe(5);
    });

    it('handles notes at maximum length (2000 chars)', async () => {
      const longNotes = 'A'.repeat(2000);

      const result = await eventService.recordHealthEvent({
        lotId:       testLotId,
        eventDate:   today,
        productName: 'Vacuna Test',
        notes:       longNotes,
        recordedBy:  testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.data?.notes?.length).toBe(2000);
    });

    it('rejects notes exceeding 2000 characters', async () => {
      const tooLongNotes = 'A'.repeat(2001);

      const result = await eventService.recordHealthEvent({
        lotId:       testLotId,
        eventDate:   today,
        productName: 'Vacuna Test',
        notes:       tooLongNotes,
        recordedBy:  testUserId,
      });

      expect(result.success).toBe(false);
    });

    it('stores event without notes (optional field)', async () => {
      const result = await eventService.recordHealthEvent({
        lotId:       testLotId,
        eventDate:   today,
        productName: 'Vacuna Sin Notas',
        recordedBy:  testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.data?.notes).toBeUndefined();

      const row = await db.getFirstAsync<any>(
        'SELECT notes FROM health_events WHERE id = ?',
        [result.data!.id]
      );
      expect(row.notes).toBeNull();
    });
  });

  // ─── T146: Chronological order ───────────────────────────────────────────

  describe('T146 - Event history in chronological descending order', () => {
    it('returns health events sorted by date descending', async () => {
      const dates = ['2024-01-10', '2024-01-20', '2024-01-05', '2024-01-15'];

      for (const date of dates) {
        await eventService.recordHealthEvent({
          lotId:       testLotId,
          eventDate:   date,
          productName: `Vacuna ${date}`,
          recordedBy:  testUserId,
        });
      }

      const result = await eventService.getHealthEventsByLot(testLotId);
      expect(result.success).toBe(true);
      expect(result.data!.length).toBe(4);

      const eventDates = result.data!.map((e) => e.eventDate);
      // Must be in descending order
      for (let i = 0; i < eventDates.length - 1; i++) {
        expect(eventDates[i] >= eventDates[i + 1]).toBe(true);
      }
      // Most recent first
      expect(eventDates[0]).toBe('2024-01-20');
      expect(eventDates[eventDates.length - 1]).toBe('2024-01-05');
    });

    it('returns biosecurity events sorted by date descending', async () => {
      const dates = ['2024-02-01', '2024-02-15', '2024-01-20'];

      for (const date of dates) {
        await eventService.recordBiosecurityEvent({
          eventDate:   date,
          productName: `Desinfección ${date}`,
          recordedBy:  testUserId,
        });
      }

      const result = await eventService.listBiosecurityEvents();
      expect(result.success).toBe(true);
      expect(result.data!.length).toBe(3);

      const eventDates = result.data!.map((e) => e.eventDate);
      for (let i = 0; i < eventDates.length - 1; i++) {
        expect(eventDates[i] >= eventDates[i + 1]).toBe(true);
      }
      expect(eventDates[0]).toBe('2024-02-15');
    });

    it('returns all health events sorted descending (listHealthEvents)', async () => {
      const dates = ['2024-03-10', '2024-03-01', '2024-03-20'];

      for (const date of dates) {
        await eventService.recordHealthEvent({
          lotId:       testLotId,
          eventDate:   date,
          productName: `Vacuna ${date}`,
          recordedBy:  testUserId,
        });
      }

      const result = await eventService.listHealthEvents();
      expect(result.success).toBe(true);
      expect(result.data!.length).toBe(3);

      const eventDates = result.data!.map((e) => e.eventDate);
      expect(eventDates[0]).toBe('2024-03-20');
      expect(eventDates[eventDates.length - 1]).toBe('2024-03-01');
    });

    it('filters health events by lot — only returns events for the given lot', async () => {
      const secondLotId = 'test-lot-2';
      const now = new Date().toISOString();
      await seedTestData(db, {
        chicken_lots: [
          {
            id:                secondLotId,
            name:              'Second Lot',
            chicken_house_id:  testHouseId,
            purchase_date:     '2024-01-01',
            initial_hen_count: 50,
            live_hen_count:    50,
            age_weeks:         10,
            created_by:        testUserId,
            created_at:        now,
            updated_at:        now,
          },
        ],
      });

      // Record events for both lots
      await eventService.recordHealthEvent({
        lotId:       testLotId,
        eventDate:   today,
        productName: 'Vacuna Lote 1',
        recordedBy:  testUserId,
      });
      await eventService.recordHealthEvent({
        lotId:       secondLotId,
        eventDate:   today,
        productName: 'Vacuna Lote 2',
        recordedBy:  testUserId,
      });

      const lot1Events = await eventService.getHealthEventsByLot(testLotId);
      expect(lot1Events.success).toBe(true);
      expect(lot1Events.data!.length).toBe(1);
      expect(lot1Events.data![0].productName).toBe('Vacuna Lote 1');

      const lot2Events = await eventService.getHealthEventsByLot(secondLotId);
      expect(lot2Events.success).toBe(true);
      expect(lot2Events.data!.length).toBe(1);
      expect(lot2Events.data![0].productName).toBe('Vacuna Lote 2');
    });

    it('returns empty array when no events exist for a lot', async () => {
      const result = await eventService.getHealthEventsByLot(testLotId);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});
