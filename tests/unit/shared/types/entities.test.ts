import {
  User,
  UserRole,
  AuthStatus,
  Invitation,
  InvitationStatus,
  ChickenHouse,
  ChickenLot,
  ProductionRecord,
  MortalityRecord,
  FeedBatch,
  FeedingRecord,
  LotEvent,
  LotEventType,
  SyncQueueEntry,
  SyncOperation,
  AuditLogEntry,
} from '@/shared/types/entities';

describe('Entity Type Definitions', () => {
  describe('Enums', () => {
    describe('UserRole', () => {
      it('should define admin role', () => {
        expect(UserRole.Admin).toBe('admin');
      });

      it('should define user role', () => {
        expect(UserRole.User).toBe('user');
      });

      it('should have exactly 2 roles', () => {
        const roles = Object.values(UserRole);
        expect(roles).toHaveLength(2);
      });
    });

    describe('InvitationStatus', () => {
      it('should define all invitation statuses', () => {
        expect(InvitationStatus.Pending).toBe('pending');
        expect(InvitationStatus.Accepted).toBe('accepted');
        expect(InvitationStatus.Expired).toBe('expired');
      });

      it('should have exactly 3 statuses', () => {
        const statuses = Object.values(InvitationStatus);
        expect(statuses).toHaveLength(3);
      });
    });

    describe('LotEventType', () => {
      it('should define vaccination event type', () => {
        expect(LotEventType.Vaccination).toBe('vaccination');
      });

      it('should define disinfection event type', () => {
        expect(LotEventType.Disinfection).toBe('disinfection');
      });

      it('should have exactly 2 event types', () => {
        const types = Object.values(LotEventType);
        expect(types).toHaveLength(2);
      });
    });

    describe('SyncOperation', () => {
      it('should define all sync operations', () => {
        expect(SyncOperation.Create).toBe('CREATE');
        expect(SyncOperation.Update).toBe('UPDATE');
        expect(SyncOperation.Delete).toBe('DELETE');
      });

      it('should have exactly 3 operations', () => {
        const operations = Object.values(SyncOperation);
        expect(operations).toHaveLength(3);
      });
    });
  });

  describe('User Interface', () => {
    it('should accept valid user object', () => {
      const user: User = {
        id: 'user-123',
        displayName: 'John Doe',
        role: UserRole.Admin,
        authStatus: AuthStatus.Authenticated,
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(user).toBeDefined();
      expect(user.id).toBe('user-123');
      expect(user.role).toBe(UserRole.Admin);
      expect(user.authStatus).toBe(AuthStatus.Authenticated);
    });

    it('should accept user with optional fields', () => {
      const user: User = {
        id: 'user-123',
        displayName: 'John Doe',
        role: UserRole.User,
        authStatus: AuthStatus.Pending,
        lastAccessAt: '2024-01-15T10:00:00.000Z',
        invitationId: 'inv-123',
        authorizedDevices: [
          {
            deviceId: 'device-1',
            deviceName: 'iPhone 12',
            authorizedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(user.lastAccessAt).toBeDefined();
      expect(user.invitationId).toBeDefined();
      expect(user.authorizedDevices).toHaveLength(1);
      expect(user.authorizedDevices?.[0].deviceName).toBe('iPhone 12');
    });
  });

  describe('Invitation Interface', () => {
    it('should accept valid invitation object', () => {
      const invitation: Invitation = {
        id: 'inv-123',
        userId: 'user-123',
        token: 'abc123token',
        createdBy: 'user-admin',
        createdAt: '2024-01-01T00:00:00.000Z',
        expiresAt: '2024-01-08T00:00:00.000Z',
        status: InvitationStatus.Pending,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(invitation).toBeDefined();
      expect(invitation.userId).toBe('user-123');
      expect(invitation.token).toBe('abc123token');
      expect(invitation.status).toBe(InvitationStatus.Pending);
    });

    it('should accept invitation with accepted fields', () => {
      const invitation: Invitation = {
        id: 'inv-123',
        userId: 'user-123',
        token: 'abc123token',
        createdBy: 'user-admin',
        createdAt: '2024-01-01T00:00:00.000Z',
        expiresAt: '2024-01-08T00:00:00.000Z',
        status: InvitationStatus.Accepted,
        acceptedAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      expect(invitation.status).toBe(InvitationStatus.Accepted);
      expect(invitation.userId).toBe('user-123');
      expect(invitation.acceptedAt).toBeDefined();
    });
  });

  describe('ChickenHouse Interface', () => {
    it('should accept valid chicken house object', () => {
      const house: ChickenHouse = {
        id: 'house-1',
        name: 'Galpón A',
        createdBy: 'user-admin',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(house).toBeDefined();
      expect(house.name).toBe('Galpón A');
    });

    it('should accept chicken house with description', () => {
      const house: ChickenHouse = {
        id: 'house-1',
        name: 'Galpón A',
        description: 'Main production house',
        createdBy: 'user-admin',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(house.description).toBe('Main production house');
    });
  });

  describe('ChickenLot Interface', () => {
    it('should accept valid chicken lot object', () => {
      const lot: ChickenLot = {
        id: 'lot-1',
        name: 'Lot 2024-01',
        chickenHouseId: 'house-1',
        purchaseDate: '2024-01-01',
        initialHenCount: 1000,
        liveHenCount: 1000,
        ageWeeks: 18,
        createdBy: 'user-admin',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(lot).toBeDefined();
      expect(lot.initialHenCount).toBe(1000);
      expect(lot.liveHenCount).toBe(1000);
    });

    it('should allow live hen count less than initial count', () => {
      const lot: ChickenLot = {
        id: 'lot-1',
        name: 'Lot 2024-01',
        chickenHouseId: 'house-1',
        purchaseDate: '2024-01-01',
        initialHenCount: 1000,
        liveHenCount: 950,
        ageWeeks: 18,
        createdBy: 'user-admin',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(lot.liveHenCount).toBeLessThan(lot.initialHenCount);
    });
  });

  describe('ProductionRecord Interface', () => {
    it('should accept valid production record', () => {
      const record: ProductionRecord = {
        id: 'prod-1',
        lotId: 'lot-1',
        date: '2024-01-15',
        eggsCollected: 850,
        recordedBy: 'user-1',
        createdAt: '2024-01-15T08:00:00.000Z',
        updatedAt: '2024-01-15T08:00:00.000Z',
      };

      expect(record).toBeDefined();
      expect(record.eggsCollected).toBe(850);
    });
  });

  describe('MortalityRecord Interface', () => {
    it('should accept valid mortality record', () => {
      const record: MortalityRecord = {
        id: 'mort-1',
        lotId: 'lot-1',
        date: '2024-01-15',
        hensDied: 5,
        recordedBy: 'user-1',
        createdAt: '2024-01-15T08:00:00.000Z',
        updatedAt: '2024-01-15T08:00:00.000Z',
      };

      expect(record).toBeDefined();
      expect(record.hensDied).toBe(5);
    });
  });

  describe('FeedBatch Interface', () => {
    it('should accept valid feed batch', () => {
      const batch: FeedBatch = {
        id: 'batch-1',
        batchName: 'Batch 2024-01',
        preparationDate: '2024-01-01',
        quantityKg: 500.5,
        preparedBy: 'user-1',
        createdAt: '2024-01-01T08:00:00.000Z',
        updatedAt: '2024-01-01T08:00:00.000Z',
      };

      expect(batch).toBeDefined();
      expect(batch.quantityKg).toBe(500.5);
    });
  });

  describe('FeedingRecord Interface', () => {
    it('should accept valid feeding record', () => {
      const record: FeedingRecord = {
        id: 'feed-1',
        lotId: 'lot-1',
        feedBatchId: 'batch-1',
        date: '2024-01-15',
        quantityFedKg: 50.25,
        recordedBy: 'user-1',
        createdAt: '2024-01-15T08:00:00.000Z',
        updatedAt: '2024-01-15T08:00:00.000Z',
      };

      expect(record).toBeDefined();
      expect(record.quantityFedKg).toBe(50.25);
    });
  });

  describe('LotEvent Interface', () => {
    it('should accept vaccination event', () => {
      const event: LotEvent = {
        id: 'event-1',
        lotId: 'lot-1',
        eventType: LotEventType.Vaccination,
        eventDate: '2024-01-15',
        productName: 'Vaccine XYZ',
        recordedBy: 'user-1',
        createdAt: '2024-01-15T08:00:00.000Z',
        updatedAt: '2024-01-15T08:00:00.000Z',
      };

      expect(event).toBeDefined();
      expect(event.eventType).toBe(LotEventType.Vaccination);
    });

    it('should accept disinfection event', () => {
      const event: LotEvent = {
        id: 'event-1',
        lotId: 'lot-1',
        eventType: LotEventType.Disinfection,
        eventDate: '2024-01-15',
        productName: 'Disinfectant ABC',
        notes: 'Full facility disinfection',
        recordedBy: 'user-1',
        createdAt: '2024-01-15T08:00:00.000Z',
        updatedAt: '2024-01-15T08:00:00.000Z',
      };

      expect(event).toBeDefined();
      expect(event.eventType).toBe(LotEventType.Disinfection);
      expect(event.notes).toBe('Full facility disinfection');
    });
  });

  describe('SyncQueueEntry Interface', () => {
    it('should accept valid sync queue entry', () => {
      const entry: SyncQueueEntry = {
        id: 'sync-1',
        entityType: 'ProductionRecord',
        entityId: 'prod-1',
        operation: SyncOperation.Create,
        localTimestamp: '2024-01-15T08:00:00.000Z',
        retryCount: 0,
      };

      expect(entry).toBeDefined();
      expect(entry.operation).toBe(SyncOperation.Create);
    });

    it('should accept sync queue entry with sync status', () => {
      const entry: SyncQueueEntry = {
        id: 'sync-1',
        entityType: 'ProductionRecord',
        entityId: 'prod-1',
        operation: SyncOperation.Update,
        localTimestamp: '2024-01-15T08:00:00.000Z',
        syncedAt: '2024-01-15T08:05:00.000Z',
        retryCount: 0,
      };

      expect(entry.syncedAt).toBeDefined();
    });

    it('should accept sync queue entry with error', () => {
      const entry: SyncQueueEntry = {
        id: 'sync-1',
        entityType: 'ProductionRecord',
        entityId: 'prod-1',
        operation: SyncOperation.Create,
        localTimestamp: '2024-01-15T08:00:00.000Z',
        retryCount: 3,
        error: 'Network timeout',
      };

      expect(entry.retryCount).toBe(3);
      expect(entry.error).toBe('Network timeout');
    });
  });

  describe('AuditLogEntry Interface', () => {
    it('should accept valid audit log entry', () => {
      const entry: AuditLogEntry = {
        id: 'audit-1',
        entityType: 'User',
        entityId: 'user-1',
        operationType: SyncOperation.Update,
        timestamp: '2024-01-15T08:00:00.000Z',
        userId: 'user-admin',
        deviceId: 'device-123',
        synced: false,
      };

      expect(entry).toBeDefined();
      expect(entry.synced).toBe(false);
    });

    it('should accept synced audit log entry', () => {
      const entry: AuditLogEntry = {
        id: 'audit-1',
        entityType: 'ProductionRecord',
        entityId: 'prod-1',
        operationType: SyncOperation.Create,
        timestamp: '2024-01-15T08:00:00.000Z',
        userId: 'user-1',
        deviceId: 'device-123',
        synced: true,
      };

      expect(entry.synced).toBe(true);
    });
  });
});
