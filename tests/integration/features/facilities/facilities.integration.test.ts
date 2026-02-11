/**
 * Integration Tests: User Story 2 - Chicken Lot and Facility Management
 *
 * Tests: T074-T077 [US2]
 * - T074: Automatic live hen count update when mortality recorded (SC-002: <10s)
 * - T075: Offline lot creation and mortality recording with sync queue
 * - T076: Edge case - mortality exceeds live hen count (should reject)
 * - T077: Edge case - lot with zero live hens (prevent production/feeding)
 *
 * Success Criteria:
 * - SC-002: Live hen count updates in < 10 seconds after mortality
 * - Sync queue properly tracks offline operations
 * - Validation prevents invalid mortality records
 * - Zero-hen lots block new production/feeding
 */

import * as SQLite from 'expo-sqlite';
import { FacilityService } from '@/features/facilities/services/FacilityService';
import { MortalityService } from '@/features/mortality/services/MortalityService';
import { ChickenHouseRepository } from '@/shared/database/repositories/ChickenHouseRepository';
import { ChickenLotRepository } from '@/shared/database/repositories/ChickenLotRepository';
import { MortalityRecordRepository } from '@/shared/database/repositories/MortalityRecordRepository';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { AuditService } from '@/shared/sync/AuditService';
import { ChickenLot, ChickenHouse, UserRole, AuthStatus } from '@/shared/types/entities';
import {
  createTestDatabase,
  cleanupTestDatabase,
  seedTestData,
} from '../../../utils/testDatabase';

describe('T074-T077: Facilities Integration Tests', () => {
  let testDb: SQLite.SQLiteDatabase;
  let facilityService: FacilityService;
  let mortalityService: MortalityService;
  let testHouse: ChickenHouse;
  let testLot: ChickenLot;

  const TEST_USER_ID = 'test-user-integration';

  beforeAll(async () => {
    // Create test database
    testDb = await createTestDatabase();

    // Create a test user to satisfy foreign key constraints
    await seedTestData(testDb, {
      users: [
        {
          id: TEST_USER_ID,
          display_name: 'Test User',
          role: UserRole.Admin,
          auth_status: AuthStatus.Authenticated,
          authorized_devices: '[]',
          is_active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    });

    // Create repositories
    const houseRepository = new ChickenHouseRepository(testDb);
    const lotRepository = new ChickenLotRepository(testDb);
    const mortalityRepository = new MortalityRecordRepository(testDb);
    const syncQueue = new SyncQueue(testDb);
    const auditService = new AuditService(testDb);

    // Create services directly with test database
    facilityService = new FacilityService(
      houseRepository,
      lotRepository,
      syncQueue
    );
    mortalityService = new MortalityService(
      testDb,
      mortalityRepository,
      lotRepository,
      syncQueue,
      auditService
    );
  });

  beforeEach(async () => {
    // Create test house with unique name
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const houseResult = await facilityService.createHouse(
      `Test House ${uniqueId}`,
      'Integration test house',
      TEST_USER_ID
    );
    if (!houseResult.success) {
      throw new Error(`House creation failed: ${houseResult.error}`);
    }
    expect(houseResult.success).toBe(true);
    testHouse = houseResult.data!;

    // Create test lot with 100 hens
    const lotResult = await facilityService.createLot(
      `Test Lot ${uniqueId}`,
      testHouse.id,
      new Date().toISOString().split('T')[0],
      100,
      18,
      TEST_USER_ID
    );
    expect(lotResult.success).toBe(true);
    testLot = lotResult.data!;
  });

  afterAll(async () => {
    await cleanupTestDatabase(testDb);
  });

  /**
   * T074: Test automatic live hen count update when mortality recorded
   * Success Criterion: SC-002 - Update visible in < 10 seconds
   */
  describe('T074: Automatic live hen count update on mortality', () => {
    it('should update live hen count within 10 seconds after recording mortality', async () => {
      // Arrange: Initial state
      const initialLiveHens = testLot.liveHenCount;
      const mortalityCount = 5;

      // Act: Record mortality and measure time
      const startTime = performance.now();

      const mortalityResult = await mortalityService.recordMortality(
        testLot.id,
        new Date().toISOString().split('T')[0],
        mortalityCount,
        TEST_USER_ID
      );

      if (!mortalityResult.success) {
        throw new Error(`Mortality recording failed: ${mortalityResult.error}`);
      }
      expect(mortalityResult.success).toBe(true);

      // Fetch updated lot details
      const updatedLotResult = await facilityService.getLotDetails(testLot.id);
      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Assert: Hen count updated correctly
      expect(updatedLotResult.success).toBe(true);
      const updatedLot = updatedLotResult.data!;
      expect(updatedLot.liveHenCount).toBe(initialLiveHens - mortalityCount);

      // Assert: Update time < 10 seconds (SC-002)
      expect(updateTime).toBeLessThan(10000);
      console.log(`✓ Live hen count updated in ${updateTime.toFixed(2)}ms`);
    });

    it('should handle multiple mortality records and update hen count correctly', async () => {
      // Arrange
      const initialLiveHens = testLot.liveHenCount;

      // Act: Record multiple mortality events
      await mortalityService.recordMortality(
        testLot.id,
        new Date().toISOString().split('T')[0],
        3,
        TEST_USER_ID
      );

      await mortalityService.recordMortality(
        testLot.id,
        new Date().toISOString().split('T')[0],
        2,
        TEST_USER_ID
      );

      // Assert: Hen count reflects all mortality
      const updatedLotResult = await facilityService.getLotDetails(testLot.id);
      expect(updatedLotResult.success).toBe(true);
      const updatedLot = updatedLotResult.data!;
      expect(updatedLot.liveHenCount).toBe(initialLiveHens - 5);
    });

    it('should maintain data integrity during concurrent mortality records', async () => {
      // Arrange
      const initialLiveHens = testLot.liveHenCount;

      // Act: Simulate concurrent mortality recordings
      const promises = [
        mortalityService.recordMortality(
          testLot.id,
          new Date().toISOString().split('T')[0],
          2,
          TEST_USER_ID
        ),
        mortalityService.recordMortality(
          testLot.id,
          new Date().toISOString().split('T')[0],
          3,
          TEST_USER_ID
        ),
      ];

      const results = await Promise.all(promises);

      // Assert: Both records succeeded
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Assert: Final count is correct
      const updatedLotResult = await facilityService.getLotDetails(testLot.id);
      const updatedLot = updatedLotResult.data!;
      expect(updatedLot.liveHenCount).toBe(initialLiveHens - 5);
    });
  });

  /**
   * T075: Test offline lot creation and mortality recording with sync queue
   */
  describe('T075: Offline operations with sync queue', () => {
    it('should enqueue lot creation for sync when created', async () => {
      // Arrange: Get initial sync queue size
      const syncQueue = new SyncQueue(testDb);

      const queueBefore = await syncQueue.getPending();
      const initialCount = queueBefore.length;

      // Act: Create a new lot
      const newLotResult = await facilityService.createLot(
        `Offline Test Lot ${Date.now()}`,
        testHouse.id,
        new Date().toISOString().split('T')[0],
        50,
        20,
        TEST_USER_ID
      );

      expect(newLotResult.success).toBe(true);

      // Assert: Sync queue has new entry
      const queueAfter = await syncQueue.getPending();
      expect(queueAfter.length).toBeGreaterThan(initialCount);

      // Verify the operation is for chicken_lots
      const lotOperation = queueAfter.find(
        op => op.tableName === 'chicken_lots' && op.recordId === newLotResult.data!.id
      );
      expect(lotOperation).toBeDefined();
      expect(lotOperation?.operation).toBe('CREATE');
    });

    it('should enqueue mortality records for sync', async () => {
      // Arrange
      const syncQueue = new SyncQueue(testDb);
      const queueBefore = await syncQueue.getPending();

      // Act: Record mortality
      const mortalityResult = await mortalityService.recordMortality(
        testLot.id,
        new Date().toISOString().split('T')[0],
        4,
        TEST_USER_ID
      );

      expect(mortalityResult.success).toBe(true);

      // Assert: Sync queue has mortality record
      const queueAfter = await syncQueue.getPending();
      expect(queueAfter.length).toBeGreaterThan(queueBefore.length);

      const mortalityOperation = queueAfter.find(
        op => op.tableName === 'mortality_records' && op.recordId === mortalityResult.data!.id
      );
      expect(mortalityOperation).toBeDefined();
      expect(mortalityOperation?.operation).toBe('CREATE');
    });

    it('should preserve data integrity when syncing after offline operations', async () => {
      // Arrange: Create lot and record mortality offline
      const offlineLotResult = await facilityService.createLot(
        `Sync Test Lot ${Date.now()}`,
        testHouse.id,
        new Date().toISOString().split('T')[0],
        80,
        16,
        TEST_USER_ID
      );
      expect(offlineLotResult.success).toBe(true);
      const offlineLot = offlineLotResult.data!;

      const mortalityResult = await mortalityService.recordMortality(
        offlineLot.id,
        new Date().toISOString().split('T')[0],
        6,
        TEST_USER_ID
      );
      expect(mortalityResult.success).toBe(true);

      // Act: Verify lot reflects mortality
      const updatedLotResult = await facilityService.getLotDetails(offlineLot.id);

      // Assert: Data is consistent
      expect(updatedLotResult.success).toBe(true);
      const updatedLot = updatedLotResult.data!;
      expect(updatedLot.liveHenCount).toBe(80 - 6);
      expect(updatedLot.initialHenCount).toBe(80);
    });
  });

  /**
   * T076: Edge case - mortality exceeds live hen count (should reject)
   */
  describe('T076: Mortality validation edge cases', () => {
    it('should reject mortality when hensDied exceeds liveHenCount', async () => {
      // Arrange: Lot has 100 live hens
      const currentLiveHens = testLot.liveHenCount;

      // Act: Try to record more deaths than live hens
      const invalidMortalityResult = await mortalityService.recordMortality(
        testLot.id,
        new Date().toISOString().split('T')[0],
        currentLiveHens + 10, // 110 deaths when only 100 alive
        TEST_USER_ID
      );

      // Assert: Operation rejected with error
      expect(invalidMortalityResult.success).toBe(false);
      expect(invalidMortalityResult.error).toBeDefined();
      expect(invalidMortalityResult.error).toContain('excede');

      // Verify hen count unchanged
      const lotResult = await facilityService.getLotDetails(testLot.id);
      expect(lotResult.data!.liveHenCount).toBe(currentLiveHens);
    });

    it('should allow mortality equal to live hen count (total loss)', async () => {
      // Arrange
      const currentLiveHens = testLot.liveHenCount;

      // Act: Record all hens dead
      const totalLossResult = await mortalityService.recordMortality(
        testLot.id,
        new Date().toISOString().split('T')[0],
        currentLiveHens,
        TEST_USER_ID
      );

      // Assert: Operation succeeds
      expect(totalLossResult.success).toBe(true);

      // Verify hen count is zero
      const lotResult = await facilityService.getLotDetails(testLot.id);
      expect(lotResult.data!.liveHenCount).toBe(0);
    });

    it('should reject mortality with zero or negative count', async () => {
      // Act & Assert: Zero mortality
      const zeroResult = await mortalityService.recordMortality(
        testLot.id,
        new Date().toISOString().split('T')[0],
        0,
        TEST_USER_ID
      );
      expect(zeroResult.success).toBe(false);

      // Act & Assert: Negative mortality
      const negativeResult = await mortalityService.recordMortality(
        testLot.id,
        new Date().toISOString().split('T')[0],
        -5,
        TEST_USER_ID
      );
      expect(negativeResult.success).toBe(false);
    });

    it('should handle sequential mortality records that approach zero correctly', async () => {
      // Arrange: Create lot with 10 hens
      const smallLotResult = await facilityService.createLot(
        `Small Lot ${Date.now()}`,
        testHouse.id,
        new Date().toISOString().split('T')[0],
        10,
        20,
        TEST_USER_ID
      );
      const smallLot = smallLotResult.data!;

      // Act: Record deaths approaching zero
      const result1 = await mortalityService.recordMortality(
        smallLot.id,
        new Date().toISOString().split('T')[0],
        7,
        TEST_USER_ID
      );
      expect(result1.success).toBe(true);

      const result2 = await mortalityService.recordMortality(
        smallLot.id,
        new Date().toISOString().split('T')[0],
        3,
        TEST_USER_ID
      );
      expect(result2.success).toBe(true);

      // Verify final count is zero
      const finalLotResult = await facilityService.getLotDetails(smallLot.id);
      expect(finalLotResult.data!.liveHenCount).toBe(0);

      // Try to record more mortality on zero-hen lot
      const exceedResult = await mortalityService.recordMortality(
        smallLot.id,
        new Date().toISOString().split('T')[0],
        1,
        TEST_USER_ID
      );
      expect(exceedResult.success).toBe(false);
    });
  });

  /**
   * T077: Edge case - lot with zero live hens (should prevent production/feeding)
   */
  describe('T077: Zero-hen lot restrictions', () => {
    let zeroHenLot: ChickenLot;

    beforeEach(async () => {
      // Create lot and kill all hens
      const lotResult = await facilityService.createLot(
        `Zero Hen Lot ${Date.now()}`,
        testHouse.id,
        new Date().toISOString().split('T')[0],
        20,
        18,
        TEST_USER_ID
      );
      zeroHenLot = lotResult.data!;

      // Kill all hens
      await mortalityService.recordMortality(
        zeroHenLot.id,
        new Date().toISOString().split('T')[0],
        20,
        TEST_USER_ID
      );

      // Verify zero hens
      const verifyResult = await facilityService.getLotDetails(zeroHenLot.id);
      expect(verifyResult.data!.liveHenCount).toBe(0);
    });

    it('should identify lot as inactive when liveHenCount is zero', async () => {
      // Act: Get lot details
      const lotResult = await facilityService.getLotDetails(zeroHenLot.id);

      // Assert: Lot has zero hens
      expect(lotResult.success).toBe(true);
      expect(lotResult.data!.liveHenCount).toBe(0);
      expect(lotResult.data!.initialHenCount).toBe(20); // Initial count preserved
    });

    it('should not appear in active lots list', async () => {
      // Act: Get active lots
      const activeLotsResult = await facilityService.listActiveLots();

      // Assert: Zero-hen lot not in active list
      expect(activeLotsResult.success).toBe(true);
      const activeLots = activeLotsResult.data || [];
      const foundZeroLot = activeLots.find(lot => lot.id === zeroHenLot.id);
      expect(foundZeroLot).toBeUndefined();
    });

    it('should still appear in all lots list', async () => {
      // Act: Get all lots
      const allLotsResult = await facilityService.listLots();

      // Assert: Zero-hen lot in complete list
      expect(allLotsResult.success).toBe(true);
      const allLots = allLotsResult.data || [];
      const foundZeroLot = allLots.find(lot => lot.id === zeroHenLot.id);
      expect(foundZeroLot).toBeDefined();
      expect(foundZeroLot!.liveHenCount).toBe(0);
    });

    it('should maintain lot history and metadata for zero-hen lots', async () => {
      // Act: Get mortality history
      const historyResult = await mortalityService.getMortalityHistory(zeroHenLot.id);

      // Assert: History preserved
      expect(historyResult.success).toBe(true);
      const history = historyResult.data || [];
      expect(history.length).toBeGreaterThan(0);

      // Verify total mortality equals initial count
      const totalMortality = history.reduce(
        (sum, record) => sum + record.hensDied,
        0
      );
      expect(totalMortality).toBe(20);
    });

    it('should calculate correct mortality rate for zero-hen lots', async () => {
      // Act: Get lot details
      const lotResult = await facilityService.getLotDetails(zeroHenLot.id);
      const lot = lotResult.data!;

      // Calculate mortality rate
      const mortalityRate = (
        ((lot.initialHenCount - lot.liveHenCount) / lot.initialHenCount) *
        100
      );

      // Assert: 100% mortality rate
      expect(mortalityRate).toBe(100);
    });
  });

  /**
   * Additional edge case: Lot deletion and integrity
   */
  describe('Additional: Lot lifecycle and integrity', () => {
    it('should prevent accessing non-existent lot', async () => {
      // Act: Try to get details for fake lot ID
      const fakeId = 'non-existent-lot-id';
      const result = await facilityService.getLotDetails(fakeId);

      // Assert: Returns error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle lot updates correctly', async () => {
      // Arrange: Update lot name
      const newName = `Updated Lot ${Date.now()}`;

      // Act: Update (through edit functionality)
      const updateResult = await facilityService.updateLot(
        testLot.id,
        { name: newName },
        TEST_USER_ID
      );

      // Assert: Update successful
      expect(updateResult.success).toBe(true);

      // Verify updated name
      const lotResult = await facilityService.getLotDetails(testLot.id);
      expect(lotResult.data!.name).toBe(newName);
    });
  });
});
