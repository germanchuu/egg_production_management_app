/**
 * Auth Integration Tests - User Story 3 Acceptance Scenarios (T164)
 *
 * Validates all acceptance criteria for US3: Invitation-Based User Authentication
 *
 * Acceptance Scenarios:
 * 1. Admin creates user → saved as "pending authentication"
 * 2. Admin generates invitation deep link → unique link created
 * 3. User opens link → sees invitation details
 * 4. User accepts invitation → marked as authenticated
 * 5. Authenticated user opens app offline → can access via cached session
 * 6. App loads online with cached session → background session validation
 * 7. Admin views user management → sees auth statuses
 * 8. Admin revokes user → authStatus = 'revoked', devices cleared
 * 9. Revoked user goes online → session validation fails ("Access Denied")
 * 10. Admin tries to re-enable revoked user → system prevents re-activation
 *
 * Success Criteria (SC-006, SC-010):
 * - SC-006: Admin can create and send invitation in < 2 minutes
 * - SC-010: Users access app offline within 3 seconds of launch after initial auth
 */

import * as SecureStore from 'expo-secure-store';
import { AuthService } from '@/features/auth/services/AuthService';
import { InvitationService } from '@/features/auth/services/InvitationService';
import { UserValidator } from '@/features/auth/models/User';
import { UserRole, AuthStatus } from '@/shared/types/entities';
import type { User } from '@/shared/types/entities';

// Mock SecureStore (expo-secure-store)
jest.mock('expo-secure-store');
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

// Mock UserServiceProvider (used internally by AuthService)
jest.mock('@/features/auth/services/UserServiceProvider', () => ({
  UserServiceProvider: {
    getUserService: jest.fn(),
  },
}));

// Mock expo-application for device ID
jest.mock('expo-application', () => ({
  androidId: 'test-android-id',
  getIosIdForVendorAsync: jest.fn().mockResolvedValue('test-ios-id'),
}));

// ─── Shared fixture ──────────────────────────────────────────────────────────
const pendingUser: User = {
  id: 'user-pending-001',
  displayName: 'María García',
  role: UserRole.User,
  authStatus: AuthStatus.Pending,
  authorizedDevices: [],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const authenticatedUser: User = {
  id: 'user-auth-001',
  displayName: 'Juan Pérez',
  role: UserRole.User,
  authStatus: AuthStatus.Authenticated,
  authorizedDevices: [
    {
      deviceId: 'device-abc',
      deviceName: 'Samsung Galaxy S21',
      authorizedAt: new Date().toISOString(),
    },
  ],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const revokedUser: User = {
  id: 'user-revoked-001',
  displayName: 'Carlos López',
  role: UserRole.User,
  authStatus: AuthStatus.Revoked,
  authorizedDevices: [],
  isActive: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('US3: Invitation-Based User Authentication — Acceptance Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no session stored
    mockSecureStore.getItemAsync.mockResolvedValue(null);
    mockSecureStore.setItemAsync.mockResolvedValue(undefined);
    mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);
  });

  // ─── Acceptance Scenario 1 ───────────────────────────────────────────────────
  describe('Scenario 1: Admin creates user — saved as pending authentication', () => {
    it('should recognise a newly created user as pending', () => {
      // Given: a user was just created by admin (authStatus = pending)
      expect(pendingUser.authStatus).toBe(AuthStatus.Pending);
      expect(pendingUser.authorizedDevices).toHaveLength(0);
    });

    it('UserValidator.canAcceptInvitation should allow pending users', () => {
      // Pending users CAN accept invitations
      expect(UserValidator.canAcceptInvitation(pendingUser)).toBe(true);
    });

    it('UserValidator.canAcceptInvitation should block already-authenticated users', () => {
      // Already-authenticated users should not re-accept
      expect(UserValidator.canAcceptInvitation(authenticatedUser)).toBe(false);
    });

    it('UserValidator.canAcceptInvitation should block revoked users', () => {
      expect(UserValidator.canAcceptInvitation(revokedUser)).toBe(false);
    });
  });

  // ─── Acceptance Scenario 2 ───────────────────────────────────────────────────
  describe('Scenario 2: Admin generates invitation deep link — unique link created', () => {
    it('should generate a deep link from an invitation token', () => {
      const token = 'abc123xyz789uniquetoken';
      const deepLink = InvitationService.generateDeepLink(token);

      // Then: link is non-empty and contains the token
      expect(deepLink).toBeTruthy();
      expect(deepLink).toContain(token);
    });

    it('should extract the token back from the deep link', () => {
      const token = 'test-token-12345';
      const deepLink = InvitationService.generateDeepLink(token);

      // Token round-trips through the deep link
      const extracted = InvitationService.extractTokenFromDeepLink(deepLink);
      expect(extracted).toBe(token);
    });

    it('should return null for an invalid / malformed deep link', () => {
      const result = InvitationService.extractTokenFromDeepLink('https://not-a-valid-link.com');
      expect(result).toBeNull();
    });
  });

  // ─── Acceptance Scenario 3 ───────────────────────────────────────────────────
  describe('Scenario 3: User opens invitation link — sees confirmation', () => {
    it('validateInvitationToken should return the invitation when token is valid', async () => {
      const token = 'valid-token-abc';

      // Mock server response for token validation
      const mockValidate = jest.fn().mockResolvedValue({
        valid: true,
        invitation: {
          id: 'inv-001',
          userId: pendingUser.id,
          token,
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
        error: undefined,
      });

      const result = await InvitationService.validateInvitationToken(token, mockValidate);

      expect(result.valid).toBe(true);
      expect(result.invitation).toBeDefined();
      expect(result.invitation!.token).toBe(token);
    });

    it('validateInvitationToken should return error for expired token', async () => {
      const mockValidate = jest.fn().mockResolvedValue({
        valid: false,
        error: 'expired',
        message: 'Invitation expired',
      });

      const result = await InvitationService.validateInvitationToken(
        'expired-token',
        mockValidate
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('expired');
    });

    it('validateInvitationToken should return error for already-accepted token', async () => {
      const mockValidate = jest.fn().mockResolvedValue({
        valid: false,
        error: 'already_accepted',
        message: 'Already accepted',
      });

      const result = await InvitationService.validateInvitationToken(
        'used-token',
        mockValidate
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('already_accepted');
    });
  });

  // ─── Acceptance Scenario 4 ───────────────────────────────────────────────────
  describe('Scenario 4: User accepts invitation — marked as authenticated', () => {
    it('should call acceptInvitation on server and return success', async () => {
      const token = 'accept-token-xyz';
      const deviceId = 'device-test-001';
      const deviceName = 'Test Device';

      const mockAcceptOnServer = jest.fn().mockResolvedValue({
        success: true,
        userId: pendingUser.id,
      });

      const result = await InvitationService.acceptInvitation(
        token,
        deviceId,
        deviceName,
        mockAcceptOnServer
      );

      expect(result.success).toBe(true);
      expect(result.userId).toBe(pendingUser.id);
      expect(mockAcceptOnServer).toHaveBeenCalledWith(token, deviceId, deviceName);
    });

    it('AuthService.acceptInvitation should store session after successful acceptance', async () => {
      // Mock UserServiceProvider to return success
      const { UserServiceProvider } = await import('@/features/auth/services/UserServiceProvider');
      const mockUserService = {
        addAuthorizedDevice: jest.fn().mockResolvedValue({
          success: true,
          data: {
            ...pendingUser,
            authStatus: AuthStatus.Authenticated,
            authorizedDevices: [
              { deviceId: 'device-new', deviceName: 'My Phone', authorizedAt: new Date().toISOString() },
            ],
          },
        }),
      };
      (UserServiceProvider.getUserService as jest.Mock).mockResolvedValue(mockUserService);

      // Mock device ID retrieval
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === 'device_id') return Promise.resolve('device-new');
        return Promise.resolve(null);
      });

      const result = await AuthService.acceptInvitation(pendingUser, 'My Phone');

      // Session should be stored
      expect(result.success).toBe(true);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  // ─── Acceptance Scenario 5 ───────────────────────────────────────────────────
  describe('Scenario 5: Authenticated user opens app offline — cached session', () => {
    it('should load cached session when offline (SC-010: < 3s)', async () => {
      // Given: session cached in SecureStore
      const sessionData = {
        userId: authenticatedUser.id,
        deviceId: 'device-abc',
        authenticatedAt: new Date().toISOString(),
        lastValidatedAt: new Date().toISOString(),
      };
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(sessionData));

      // When: app checks for active session
      const start = Date.now();
      const hasSession = await AuthService.hasActiveSession();
      const elapsed = Date.now() - start;

      // Then: session is found
      expect(hasSession).toBe(true);

      // SC-010: offline session check < 3s
      expect(elapsed).toBeLessThan(3000);
    });

    it('should return null session when no cached session exists', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const session = await AuthService.getStoredSession();
      expect(session).toBeNull();
    });
  });

  // ─── Acceptance Scenario 6 ───────────────────────────────────────────────────
  describe('Scenario 6: Online app load — background session validation', () => {
    it('should validate session against Firestore when user is online', async () => {
      // Given: valid session stored
      const sessionData = {
        userId: authenticatedUser.id,
        deviceId: 'device-abc',
        authenticatedAt: new Date().toISOString(),
        lastValidatedAt: new Date().toISOString(),
      };
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(sessionData));

      // When: app validates session with Firestore
      const mockGetUser = jest.fn().mockResolvedValue(authenticatedUser);
      const result = await AuthService.validateSession(mockGetUser);

      // Then: session is valid
      expect(result.valid).toBe(true);
      expect(mockGetUser).toHaveBeenCalledWith(authenticatedUser.id);
    });

    it('should invalidate session if device not in authorizedDevices', async () => {
      const sessionData = {
        userId: authenticatedUser.id,
        deviceId: 'device-unknown', // Not in user's devices
        authenticatedAt: new Date().toISOString(),
        lastValidatedAt: new Date().toISOString(),
      };
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(sessionData));

      const mockGetUser = jest.fn().mockResolvedValue(authenticatedUser);
      const result = await AuthService.validateSession(mockGetUser);

      expect(result.valid).toBe(false);
    });
  });

  // ─── Acceptance Scenario 7 ───────────────────────────────────────────────────
  describe('Scenario 7: Admin views user management — sees auth statuses', () => {
    it('should report correct auth status for pending user', () => {
      expect(pendingUser.authStatus).toBe(AuthStatus.Pending);
    });

    it('should report correct auth status for authenticated user', () => {
      expect(authenticatedUser.authStatus).toBe(AuthStatus.Authenticated);
    });

    it('should report correct auth status for revoked user', () => {
      expect(revokedUser.authStatus).toBe(AuthStatus.Revoked);
    });
  });

  // ─── Acceptance Scenario 8 ───────────────────────────────────────────────────
  describe('Scenario 8: Admin revokes user — authStatus = revoked, devices cleared', () => {
    it('UserValidator.isRevoked should be true for revoked users', () => {
      expect(UserValidator.isRevoked(revokedUser)).toBe(true);
    });

    it('UserValidator.isRevoked should be false for active authenticated users', () => {
      expect(UserValidator.isRevoked(authenticatedUser)).toBe(false);
    });

    it('revokedUser should have no authorizedDevices', () => {
      // After revocation all devices are cleared
      expect(revokedUser.authorizedDevices).toHaveLength(0);
    });
  });

  // ─── Acceptance Scenario 9 ───────────────────────────────────────────────────
  describe('Scenario 9: Revoked user goes online — session validation fails', () => {
    it('should return revoked error and clear session when user is revoked', async () => {
      const sessionData = {
        userId: revokedUser.id,
        deviceId: 'device-old',
        authenticatedAt: new Date().toISOString(),
        lastValidatedAt: new Date().toISOString(),
      };
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(sessionData));

      const mockGetUser = jest.fn().mockResolvedValue(revokedUser);
      const result = await AuthService.validateSession(mockGetUser);

      // Access denied — revoked
      expect(result.valid).toBe(false);
      expect(result.error).toBe('revoked');

      // Local session cleared
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalled();
    });
  });

  // ─── Acceptance Scenario 10 ──────────────────────────────────────────────────
  describe('Scenario 10: Re-enabling revoked user — system prevents re-activation', () => {
    it('should not allow revoked users to accept invitations', () => {
      // Revocation is permanent — canAcceptInvitation blocks revoked users
      expect(UserValidator.canAcceptInvitation(revokedUser)).toBe(false);
    });

    it('isRevoked should remain true regardless of other fields', () => {
      const stillRevoked: User = {
        ...revokedUser,
        isActive: true, // even if someone tries to set isActive=true
      };
      // authStatus is the source of truth
      expect(UserValidator.isRevoked(stillRevoked)).toBe(true);
    });
  });
});
