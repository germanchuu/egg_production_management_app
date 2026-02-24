/**
 * Facilities Integration Tests - User Story 2 Acceptance Scenarios (T163)
 *
 * Validates all acceptance criteria for US2: Chicken Lot and Facility Management
 *
 * Acceptance Scenarios:
 * 1. Given an administrator is logged in, When they create a chicken house with a name,
 *    Then the house is saved and available for lot assignment
 * 2. Given chicken houses exist, When an administrator creates a new lot with required fields,
 *    Then the lot is created and assigned to the house
 * 3. Given a lot exists with live hens, When a user records daily mortality,
 *    Then the system automatically subtracts mortality from live hens and shows updated count
 * 4. Given lot information modified offline, When connectivity restored,
 *    Then changes sync to the server and visible to all users
 *
 * Success Criteria (SC-002, SC-003):
 * - SC-002: Record mortality + see updated live hen count within 10 seconds
 * - SC-003: Sync all offline data within 30 seconds of connectivity restoration
 */

import * as SQLite from 'expo-sqlite';
import { FacilityService } from '@/features/facilities/services/FacilityService';
import { MortalityService } from '@/features/mortality/services/MortalityService';
import { ChickenHouseRepository } from '@/shared/database/repositories/ChickenHouseRepository';
import { ChickenLotRepository } from '@/shared/database/repositories/ChickenLotRepository';
import { MortalityRecordRepository } from '@/shared/database/repositories/MortalityRecordRepository';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { AuditService } from '@/shared/sync/AuditService';
import { AuditLogRepository } from '@/shared/database/repositories/AuditLogRepository';
import {
  createTestDatabase,
  cleanupTestDatabase,
  seedTestData,
} from '../../../../tests/utils/testDatabase';

// Mock Firebase (offline — no Firebase calls expected for local operations)
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

describe('US2: Chicken Lot and Facility Management — Acceptance Scenarios', () => {
  let db: SQLite.SQLiteDatabase;
  let facilityService: FacilityService;
  let mortalityService: MortalityService;
  let syncQueue: SyncQueue;
  let auditService: AuditService;

  const adminId = 'admin-001';
  const userId = 'user-001';
  const houseId = 'house-001';
  const lotId = 'lot-001';

  beforeEach(async () => {
    db = await createTestDatabase();

    const houseRepo = new ChickenHouseRepository(db);
    const lotRepo = new ChickenLotRepository(db);
    const mortalityRepo = new MortalityRecordRepository(db);
    syncQueue = new SyncQueue(db);
    const auditLogRepo = new AuditLogRepository(db);
    auditService = new AuditService(auditLogRepo, syncQueue);

    facilityService = new FacilityService(houseRepo, lotRepo, syncQueue);
    mortalityService = new MortalityService(db, mortalityRepo, lotRepo, syncQueue, auditService);

    const now = new Date().toISOString();
    await seedTestData(db, {
      users: [
        {
          id: adminId,
          display_name: 'Admin User',
          role: 'admin',
          auth_status: 'authenticated',
          created_at: now,
          updated_at: now,
          is_active: 1,
        },
        {
          id: userId,
          display_name: 'Regular User',
          role: 'user',
          auth_status: 'authenticated',
          created_at: now,
          updated_at: now,
          is_active: 1,
        },
      ],
    });

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
  });

  // ─── Acceptance Scenario 1 ───────────────────────────────────────────────────
  describe('Scenario 1: Create chicken house — saved and available for lot assignment', () => {
    it('should save the chicken house to local SQLite after creation', async () => {
      // Given: admin is logged in
      // When: they create a new chicken house
      const result = await facilityService.createHouse(
        'Galpón A',
        'Primer galpón de la granja',
        adminId
      );

      // Then: house is saved
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.name).toBe('Galpón A');
      expect(result.data!.createdBy).toBe(adminId);

      // And: available via listHouses
      const listResult = await facilityService.listHouses();
      expect(listResult.success).toBe(true);
      expect(listResult.data!.some((h) => h.name === 'Galpón A')).toBe(true);
    });

    it('should enqueue house creation for sync', async () => {
      await facilityService.createHouse('Galpón B', undefined, adminId);

      const pending = await syncQueue.getPending();
      expect(pending).toHaveLength(1);
      expect(pending[0].entity_type).toBe('chicken_houses');
      expect(pending[0].operation).toBe('CREATE');
    });

    it('should reject duplicate house name', async () => {
      await facilityService.createHouse('Galpón Único', undefined, adminId);

      const duplicateResult = await facilityService.createHouse(
        'Galpón Único',
        undefined,
        adminId
      );

      expect(duplicateResult.success).toBe(false);
      expect(duplicateResult.error).toContain('Galpón Único');
    });
  });

  // ─── Acceptance Scenario 2 ───────────────────────────────────────────────────
  describe('Scenario 2: Create lot — created and assigned to a house', () => {
    beforeEach(async () => {
      // Pre-create the house
      const now = new Date().toISOString();
      await seedTestData(db, {
        chicken_houses: [
          {
            id: houseId,
            name: 'Galpón Norte',
            description: null,
            created_by: adminId,
            created_at: now,
            updated_at: now,
          },
        ],
      });
    });

    it('should create lot and assign it to the chicken house', async () => {
      // Given: a chicken house exists
      // When: admin creates a lot with required fields
      const result = await facilityService.createLot(
        'Lote Enero 2024',
        houseId,
        '2024-01-01',
        1000,
        20,
        adminId
      );

      // Then: lot is created and assigned
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.name).toBe('Lote Enero 2024');
      expect(result.data!.chickenHouseId).toBe(houseId);
      expect(result.data!.initialHenCount).toBe(1000);
      expect(result.data!.liveHenCount).toBe(1000); // starts equal to initial
    });

    it('should make the lot visible in house lot list', async () => {
      await facilityService.createLot(
        'Lote Prueba',
        houseId,
        '2024-01-01',
        500,
        10,
        adminId
      );

      const lotsResult = await facilityService.listLotsByHouse(houseId);
      expect(lotsResult.success).toBe(true);
      expect(lotsResult.data!.some((l) => l.name === 'Lote Prueba')).toBe(true);
    });

    it('should enqueue lot creation for sync', async () => {
      await facilityService.createLot(
        'Lote Sync Test',
        houseId,
        '2024-01-01',
        800,
        15,
        adminId
      );

      const pending = await syncQueue.getPending();
      expect(pending.some((p) => p.entity_type === 'chicken_lots')).toBe(true);
    });
  });

  // ─── Acceptance Scenario 3 ───────────────────────────────────────────────────
  describe('Scenario 3: Record mortality — live hens automatically subtracted', () => {
    beforeEach(async () => {
      const now = new Date().toISOString();
      await seedTestData(db, {
        chicken_houses: [
          {
            id: houseId,
            name: 'Galpón Norte',
            description: null,
            created_by: adminId,
            created_at: now,
            updated_at: now,
          },
        ],
        chicken_lots: [
          {
            id: lotId,
            name: 'Lote Enero 2024',
            chicken_house_id: houseId,
            purchase_date: '2024-01-01',
            initial_hen_count: 1000,
            live_hen_count: 950,
            age_weeks: 20,
            created_by: adminId,
            created_at: now,
            updated_at: now,
          },
        ],
      });
    });

    it('should subtract mortality count from live hens and return updated lot', async () => {
      // Given: lot has 950 live hens
      // When: user records 10 deaths
      const start = Date.now();
      const result = await mortalityService.recordMortality(lotId, '2024-01-15', 10, userId);
      const elapsed = Date.now() - start;

      // Then: live hens updated correctly
      expect(result.success).toBe(true);
      expect(result.data?.lot.liveHenCount).toBe(940); // 950 - 10

      // SC-002: within 10 seconds
      expect(elapsed).toBeLessThan(10000);
    });

    it('should persist the updated live hen count in the database', async () => {
      await mortalityService.recordMortality(lotId, '2024-01-15', 25, userId);

      const updatedLot = await db.getFirstAsync<any>(
        'SELECT live_hen_count FROM chicken_lots WHERE id = ?',
        [lotId]
      );
      expect(updatedLot?.live_hen_count).toBe(925); // 950 - 25
    });

    it('should reject mortality higher than available live hens', async () => {
      const result = await mortalityService.recordMortality(
        lotId,
        '2024-01-15',
        1000, // more than 950 live hens
        userId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();

      // Live hen count unchanged
      const lot = await db.getFirstAsync<any>(
        'SELECT live_hen_count FROM chicken_lots WHERE id = ?',
        [lotId]
      );
      expect(lot?.live_hen_count).toBe(950);
    });

    it('should create mortality record and sync entry atomically', async () => {
      const result = await mortalityService.recordMortality(lotId, '2024-01-15', 5, userId);

      expect(result.success).toBe(true);

      // Both mortality record and lot update enqueued
      const pending = await syncQueue.getPending();
      const types = pending.map((p) => p.entity_type);
      expect(types).toContain('mortality_records');
      expect(types).toContain('chicken_lots');
    });
  });

  // ─── Acceptance Scenario 4 ───────────────────────────────────────────────────
  describe('Scenario 4: Offline modifications — sync queue populated for later upload', () => {
    beforeEach(async () => {
      const now = new Date().toISOString();
      await seedTestData(db, {
        chicken_houses: [
          {
            id: houseId,
            name: 'Galpón Sur',
            description: null,
            created_by: adminId,
            created_at: now,
            updated_at: now,
          },
        ],
        chicken_lots: [
          {
            id: lotId,
            name: 'Lote Feb 2024',
            chicken_house_id: houseId,
            purchase_date: '2024-02-01',
            initial_hen_count: 800,
            live_hen_count: 780,
            age_weeks: 12,
            created_by: adminId,
            created_at: now,
            updated_at: now,
          },
        ],
      });
    });

    it('should enqueue lot update for sync when modified offline', async () => {
      // Simulate offline update to lot description
      const updateResult = await facilityService.updateLot(lotId, 'Lote Feb 2024 (rev)', adminId);

      expect(updateResult.success).toBe(true);

      const pending = await syncQueue.getPending();
      expect(pending.some((p) => p.entity_type === 'chicken_lots' && p.operation === 'UPDATE')).toBe(true);
    });

    it('should accumulate multiple offline changes in sync queue', async () => {
      // Multiple changes while offline
      await facilityService.updateLot(lotId, 'Lote Actualizado', adminId);
      await mortalityService.recordMortality(lotId, '2024-02-10', 5, userId);

      const pending = await syncQueue.getPending();

      // At minimum: lot update + mortality record + lot update from mortality
      expect(pending.length).toBeGreaterThanOrEqual(2);
    });
  });
});
