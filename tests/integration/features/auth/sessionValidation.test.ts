/**
 * Integration Tests: Session Validation & Revocation Flow
 *
 * T054  — Background session validation when online (runs BEFORE sync)
 * T054a — User revocation flow: admin revokes → online → "Access Denied"
 * T054b — Revocation is permanent: cannot be re-enabled, cannot accept new invitations
 */

import * as SecureStore from 'expo-secure-store';
import { AuthService } from '@/features/auth/services/AuthService';
import { UserValidator } from '@/features/auth/models/User';
import { UserRole, AuthStatus } from '@/shared/types/entities';
import type { User } from '@/shared/types/entities';

jest.mock('expo-secure-store');
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

jest.mock('@/features/auth/services/UserServiceProvider', () => ({
  UserServiceProvider: { getUserService: jest.fn() },
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const activeUser: User = {
  id: 'user-active',
  displayName: 'Ana Torres',
  role: UserRole.User,
  authStatus: AuthStatus.Authenticated,
  authorizedDevices: [
    { deviceId: 'device-123', deviceName: 'Mi Teléfono', authorizedAt: new Date().toISOString() },
  ],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const revokedUser: User = {
  id: 'user-revoked',
  displayName: 'Pedro Ramos',
  role: UserRole.User,
  authStatus: AuthStatus.Revoked,
  authorizedDevices: [],
  isActive: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const pendingUser: User = {
  id: 'user-pending',
  displayName: 'Laura Méndez',
  role: UserRole.User,
  authStatus: AuthStatus.Pending,
  authorizedDevices: [],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const validSession = {
  userId: activeUser.id,
  deviceId: 'device-123',
  authenticatedAt: new Date().toISOString(),
  lastValidatedAt: new Date().toISOString(),
};

// ─── T054: Background session validation (online, before sync) ────────────────

describe('T054: Background session validation when online', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(validSession));
    mockSecureStore.setItemAsync.mockResolvedValue(undefined);
    mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);
  });

  it('should call getUserFromFirestore to validate session before sync', async () => {
    const mockGetUser = jest.fn().mockResolvedValue(activeUser);

    const result = await AuthService.validateSession(mockGetUser);

    // Validation must reach Firestore
    expect(mockGetUser).toHaveBeenCalledWith(validSession.userId);
    expect(result.valid).toBe(true);
  });

  it('should return valid when user is active and device is authorized', async () => {
    const mockGetUser = jest.fn().mockResolvedValue(activeUser);

    const result = await AuthService.validateSession(mockGetUser);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid when no session is cached (user must re-auth)', async () => {
    mockSecureStore.getItemAsync.mockResolvedValue(null);
    const mockGetUser = jest.fn();

    const result = await AuthService.validateSession(mockGetUser);

    expect(result.valid).toBe(false);
    // Should not hit Firestore if there's no local session
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should return invalid when user is not found in Firestore', async () => {
    const mockGetUser = jest.fn().mockResolvedValue(null);

    const result = await AuthService.validateSession(mockGetUser);

    expect(result.valid).toBe(false);
  });

  it('should return invalid when device is no longer in authorizedDevices', async () => {
    const sessionWithUnknownDevice = {
      ...validSession,
      deviceId: 'device-unknown',
    };
    mockSecureStore.getItemAsync.mockResolvedValue(
      JSON.stringify(sessionWithUnknownDevice)
    );
    const mockGetUser = jest.fn().mockResolvedValue(activeUser);

    const result = await AuthService.validateSession(mockGetUser);

    expect(result.valid).toBe(false);
  });
});

// ─── T054a: User revocation flow ─────────────────────────────────────────────

describe('T054a: User revocation flow — online → "Access Denied"', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);
  });

  it('should detect revocation during session validation when user goes online', async () => {
    // Given: revoked user's session is still cached locally
    mockSecureStore.getItemAsync.mockResolvedValue(
      JSON.stringify({ ...validSession, userId: revokedUser.id })
    );

    // When: user goes online and session is validated against Firestore
    const mockGetUser = jest.fn().mockResolvedValue(revokedUser);
    const result = await AuthService.validateSession(mockGetUser);

    // Then: access denied
    expect(result.valid).toBe(false);
    expect(result.error).toBe('revoked');
  });

  it('should clear local session when revocation is detected', async () => {
    mockSecureStore.getItemAsync.mockResolvedValue(
      JSON.stringify({ ...validSession, userId: revokedUser.id })
    );
    const mockGetUser = jest.fn().mockResolvedValue(revokedUser);

    await AuthService.validateSession(mockGetUser);

    // Session must be wiped so user cannot access the app
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it('should include a descriptive message for the "Access Denied" screen', async () => {
    mockSecureStore.getItemAsync.mockResolvedValue(
      JSON.stringify({ ...validSession, userId: revokedUser.id })
    );
    const mockGetUser = jest.fn().mockResolvedValue(revokedUser);

    const result = await AuthService.validateSession(mockGetUser);

    expect(result.message).toBeTruthy();
    expect(result.message).toContain('revocado');
  });

  it('revokeUser should call the server-side revocation function', async () => {
    const mockRevokeOnServer = jest.fn().mockResolvedValue(true);

    const result = await AuthService.revokeUser(revokedUser.id, mockRevokeOnServer);

    expect(result.success).toBe(true);
    expect(mockRevokeOnServer).toHaveBeenCalledWith(revokedUser.id);
  });

  it('revokeUser should return failure if server-side revocation fails', async () => {
    const mockRevokeOnServer = jest.fn().mockResolvedValue(false);

    const result = await AuthService.revokeUser(revokedUser.id, mockRevokeOnServer);

    expect(result.success).toBe(false);
  });
});

// ─── T054b: Revocation is permanent ──────────────────────────────────────────

describe('T054b: Revocation is permanent — cannot be re-enabled or re-invited', () => {
  it('UserValidator.canAcceptInvitation should block revoked users', () => {
    expect(UserValidator.canAcceptInvitation(revokedUser)).toBe(false);
  });

  it('UserValidator.canAcceptInvitation should block revoked users even if isActive is set to true', () => {
    // Simulate an attempt to re-enable by flipping isActive
    const tamperedUser: User = { ...revokedUser, isActive: true };
    // authStatus is the source of truth — still revoked
    expect(UserValidator.canAcceptInvitation(tamperedUser)).toBe(false);
  });

  it('UserValidator.isRevoked should remain true regardless of other fields', () => {
    const tamperedUser: User = {
      ...revokedUser,
      isActive: true,
      authorizedDevices: [
        { deviceId: 'new-device', deviceName: 'Nuevo', authorizedAt: new Date().toISOString() },
      ],
    };
    expect(UserValidator.isRevoked(tamperedUser)).toBe(true);
  });

  it('pending users can accept invitations but revoked users cannot', () => {
    expect(UserValidator.canAcceptInvitation(pendingUser)).toBe(true);
    expect(UserValidator.canAcceptInvitation(revokedUser)).toBe(false);
  });

  it('authenticated users cannot re-accept invitations', () => {
    // Already authenticated — invitation would be a duplicate
    expect(UserValidator.canAcceptInvitation(activeUser)).toBe(false);
  });

  it('revoked user session validation always fails even if they get a new session token', async () => {
    // Even if somehow a revoked user gets a fresh session cached
    mockSecureStore.getItemAsync.mockResolvedValue(
      JSON.stringify({
        userId: revokedUser.id,
        deviceId: 'fresh-device',
        authenticatedAt: new Date().toISOString(),
        lastValidatedAt: new Date().toISOString(),
      })
    );
    mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);

    // Firestore returns revoked user
    const mockGetUser = jest.fn().mockResolvedValue(revokedUser);
    const result = await AuthService.validateSession(mockGetUser);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('revoked');
    // Session wiped again
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalled();
  });
});
