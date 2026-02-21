/**
 * Audit Logging Integration Tests (T171)
 *
 * Tests audit logging for critical operations:
 * - Invitation creation / acceptance
 * - Lot creation and deletion
 * - High mortality events (>10% mortality rate)
 *
 * Security requirement: All critical operations must leave an audit trail
 * that admins can review via the admin console.
 */

import * as SQLite from 'expo-sqlite';
import { AuditService } from '@/shared/sync/AuditService';
import { AuditLogRepository } from '@/shared/database/repositories/AuditLogRepository';
import { MortalityService } from '@/features/mortality/services/MortalityService';
import { MortalityRecordRepository } from '@/shared/database/repositories/MortalityRecordRepository';
import { ChickenLotRepository } from '@/shared/database/repositories/ChickenLotRepository';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { SyncOperation } from '@/shared/types/entities';
import {
  createTestDatabase,
  cleanupTestDatabase,
  seedTestData,
} from '../utils/testDatabase';

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

describe('Audit Logging — Critical Operations', () => {
  let db: SQLite.SQLiteDatabase;
  let auditService: AuditService;
  let mortalityService: MortalityService;
  let syncQueue: SyncQueue;

  const adminId = 'admin-001';
  const userId = 'user-001';
  const houseId = 'house-001';
  const lotId = 'lot-001';

  beforeEach(async () => {
    db = await createTestDatabase();

    const auditLogRepo = new AuditLogRepository(db);
    syncQueue = new SyncQueue(db);
    auditService = new AuditService(auditLogRepo, syncQueue);

    const mortalityRepo = new MortalityRecordRepository(db);
    const lotRepo = new ChickenLotRepository(db);
    mortalityService = new MortalityService(db, mortalityRepo, lotRepo, syncQueue, auditService);

    const now = new Date().toISOString();
    await seedTestData(db, {
      users: [
        {
          id: adminId,
          display_name: 'Admin',
          role: 'admin',
          auth_status: 'authenticated',
          created_at: now,
          updated_at: now,
          is_active: 1,
        },
        {
          id: userId,
          display_name: 'User',
          role: 'user',
          auth_status: 'authenticated',
          created_at: now,
          updated_at: now,
          is_active: 1,
        },
      ],
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
          live_hen_count: 1000,
          age_weeks: 20,
          created_by: adminId,
          created_at: now,
          updated_at: now,
        },
      ],
    });

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
  });

  // ─── Invitation Acceptance ────────────────────────────────────────────────────
  describe('Invitation creation / acceptance audit logging', () => {
    it('should create an audit log entry when a user is created', async () => {
      const newUserId = 'new-user-999';

      const result = await auditService.logUserCreation(newUserId, adminId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.entityType).toBe('User');
      expect(result.data!.entityId).toBe(newUserId);
      expect(result.data!.operationType).toBe(SyncOperation.Create);
      expect(result.data!.userId).toBe(adminId);
    });

    it('should create an audit log entry when an invitation is accepted', async () => {
      const invitationId = 'inv-abc123';

      const result = await auditService.logInvitationAcceptance(invitationId, userId);

      expect(result.success).toBe(true);
      expect(result.data!.entityType).toBe('Invitation');
      expect(result.data!.entityId).toBe(invitationId);
      expect(result.data!.operationType).toBe(SyncOperation.Update);
      expect(result.data!.userId).toBe(userId);
    });

    it('should enqueue audit log for sync to Firestore', async () => {
      await auditService.logUserCreation('user-xyz', adminId);

      const pending = await syncQueue.getPending();
      expect(pending.some((p) => p.entity_type === 'audit_logs')).toBe(true);
    });
  });

  // ─── Lot Creation and Deletion ────────────────────────────────────────────────
  describe('Lot creation and deletion audit logging', () => {
    it('should create an audit log entry when a lot is created', async () => {
      const newLotId = 'lot-new-001';

      const result = await auditService.logLotCreation(newLotId, adminId);

      expect(result.success).toBe(true);
      expect(result.data!.entityType).toBe('ChickenLot');
      expect(result.data!.entityId).toBe(newLotId);
      expect(result.data!.operationType).toBe(SyncOperation.Create);
    });

    it('should create an audit log entry when a lot is deleted', async () => {
      const result = await auditService.logLotDeletion(lotId, adminId);

      expect(result.success).toBe(true);
      expect(result.data!.entityType).toBe('ChickenLot');
      expect(result.data!.entityId).toBe(lotId);
      expect(result.data!.operationType).toBe(SyncOperation.Delete);
    });

    it('should persist audit log entry to local database', async () => {
      await auditService.logLotCreation('lot-persist-test', adminId);

      const entries = await db.getAllAsync<any>(
        'SELECT * FROM audit_log_local WHERE entity_type = ?',
        ['ChickenLot']
      );
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0].entity_id).toBe('lot-persist-test');
    });
  });

  // ─── High Mortality (> 10%) ───────────────────────────────────────────────────
  describe('High mortality audit logging (>10% mortality rate)', () => {
    it('should create audit log when mortality exceeds 10% of live hens', async () => {
      // 1000 live hens; recording 150 deaths = 15% mortality → HIGH
      const result = await mortalityService.recordMortality(lotId, '2024-01-15', 150, userId);

      expect(result.success).toBe(true);

      // Verify audit log was created for the high mortality event
      const auditEntries = await db.getAllAsync<any>(
        'SELECT * FROM audit_log_local WHERE entity_type = ?',
        ['MortalityRecord']
      );
      expect(auditEntries.length).toBeGreaterThan(0);
      expect(auditEntries[0].user_id).toBe(userId);
    });

    it('should NOT create audit log for mortality below 10%', async () => {
      // 1000 live hens; recording 5 deaths = 0.5% mortality → normal
      const result = await mortalityService.recordMortality(lotId, '2024-01-15', 5, userId);

      expect(result.success).toBe(true);

      // No audit log for low mortality
      const auditEntries = await db.getAllAsync<any>(
        'SELECT * FROM audit_log_local WHERE entity_type = ?',
        ['MortalityRecord']
      );
      expect(auditEntries).toHaveLength(0);
    });

    it('should create audit log for exactly 10% mortality boundary', async () => {
      // 1000 live hens; recording 100 deaths = 10% → should log (boundary)
      const result = await mortalityService.recordMortality(lotId, '2024-01-15', 100, userId);

      expect(result.success).toBe(true);

      const auditEntries = await db.getAllAsync<any>(
        'SELECT * FROM audit_log_local WHERE entity_type = ?',
        ['MortalityRecord']
      );
      expect(auditEntries.length).toBeGreaterThan(0);
    });
  });

  // ─── Audit Query ──────────────────────────────────────────────────────────────
  describe('Audit log query and retrieval', () => {
    it('should query audit log entries for a specific entity', async () => {
      const entityId = 'query-target-lot';
      await auditService.logLotCreation(entityId, adminId);
      await auditService.logLotDeletion(entityId, adminId);

      const result = await auditService.getEntityAuditLog(entityId);

      expect(result.success).toBe(true);
      expect(result.data!.entries).toHaveLength(2);
      result.data!.entries.forEach((entry) => {
        expect(entry.entityId).toBe(entityId);
      });
    });

    it('should return pending (unsynced) audit logs', async () => {
      await auditService.logUserCreation('user-pending-log', adminId);
      await auditService.logInvitationAcceptance('inv-pending', userId);

      const result = await auditService.getPendingAuditLogs();

      expect(result.success).toBe(true);
      expect(result.data!.length).toBeGreaterThanOrEqual(2);
    });
  });
});
