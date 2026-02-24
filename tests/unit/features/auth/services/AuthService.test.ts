/**
 * AuthService Tests
 *
 * Tests for the authentication service that manages sessions and user authentication.
 */

import { AuthService } from '@/features/auth/services/AuthService';
import { User, AuthStatus, UserRole, SessionData } from '@/shared/types/entities';
import * as SecureStore from 'expo-secure-store';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock UserServiceProvider to avoid database initialization in unit tests
jest.mock('@/features/auth/services/UserServiceProvider', () => ({
  UserServiceProvider: {
    getUserService: jest.fn().mockResolvedValue({
      addAuthorizedDevice: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'user-123',
          displayName: 'Test User',
          role: 'user',
          authStatus: 'authenticated',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          authorizedDevices: [
            {
              deviceId: 'generated-device-id',
              deviceName: 'Test Device',
              authorizedAt: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
      }),
    }),
  },
}));

describe('AuthService', () => {
  const mockUser: User = {
    id: 'user-123',
    displayName: 'Test User',
    role: UserRole.User,
    authStatus: AuthStatus.Pending,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    authorizedDevices: [],
  };

  const mockAuthenticatedUser: User = {
    ...mockUser,
    authStatus: AuthStatus.Authenticated,
    authorizedDevices: [
      {
        deviceId: 'device-123',
        deviceName: 'Test Device',
        authorizedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and create session for pending user', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null); // No existing device ID
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await AuthService.acceptInvitation(mockUser, 'Test Device');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2); // Device ID + Session
    });

    it('should fail for non-pending user', async () => {
      const authenticatedUser = { ...mockUser, authStatus: AuthStatus.Authenticated };

      const result = await AuthService.acceptInvitation(authenticatedUser, 'Test Device');

      expect(result.success).toBe(false);
      expect(result.error).toContain('no puede aceptar la invitación');
    });

    it('should fail for revoked user', async () => {
      const revokedUser = { ...mockUser, authStatus: AuthStatus.Revoked };

      const result = await AuthService.acceptInvitation(revokedUser, 'Test Device');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reuse existing device ID if available', async () => {
      const existingDeviceId = 'existing-device-123';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(existingDeviceId);
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await AuthService.acceptInvitation(mockUser, 'Test Device');

      // Should only set session, not device ID
      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_session',
        expect.stringContaining(existingDeviceId)
      );
    });
  });

  describe('logout', () => {
    it('should clear session from secure storage', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await AuthService.logout();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_session');
    });

    it('should handle errors during logout', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(AuthService.logout()).rejects.toThrow('Storage error');
    });
  });

  describe('getStoredSession', () => {
    it('should retrieve session from secure storage', async () => {
      const sessionData: SessionData = {
        userId: 'user-123',
        deviceId: 'device-123',
        authenticatedAt: '2024-01-01T00:00:00.000Z',
        lastValidatedAt: '2024-01-01T00:00:00.000Z',
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(sessionData)
      );

      const result = await AuthService.getStoredSession();

      expect(result).toEqual(sessionData);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_session');
    });

    it('should return null if no session exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await AuthService.getStoredSession();

      expect(result).toBeNull();
    });

    it('should return null if session is invalid JSON', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('invalid-json');

      const result = await AuthService.getStoredSession();

      expect(result).toBeNull();
    });
  });

  describe('storeSession', () => {
    it('should store session in secure storage', async () => {
      const sessionData: SessionData = {
        userId: 'user-123',
        deviceId: 'device-123',
        authenticatedAt: '2024-01-01T00:00:00.000Z',
        lastValidatedAt: '2024-01-01T00:00:00.000Z',
      };

      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await AuthService.storeSession(sessionData);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_session',
        JSON.stringify(sessionData)
      );
    });

    it('should handle errors during storage', async () => {
      const sessionData: SessionData = {
        userId: 'user-123',
        deviceId: 'device-123',
        authenticatedAt: '2024-01-01T00:00:00.000Z',
        lastValidatedAt: '2024-01-01T00:00:00.000Z',
      };

      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(AuthService.storeSession(sessionData)).rejects.toThrow(
        'Storage error'
      );
    });
  });

  describe('validateSession', () => {
    const sessionData: SessionData = {
      userId: 'user-123',
      deviceId: 'device-123',
      authenticatedAt: '2024-01-01T00:00:00.000Z',
      lastValidatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should validate session successfully for authenticated user', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(sessionData)
      );
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      const getUserMock = jest.fn().mockResolvedValue(mockAuthenticatedUser);

      const result = await AuthService.validateSession(getUserMock);

      expect(result.valid).toBe(true);
      expect(getUserMock).toHaveBeenCalledWith('user-123');
      // Should update lastValidatedAt
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('should fail validation if no session exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const getUserMock = jest.fn();

      const result = await AuthService.validateSession(getUserMock);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('invalid_session');
      expect(getUserMock).not.toHaveBeenCalled();
    });

    it('should fail validation if user not found', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(sessionData)
      );

      const getUserMock = jest.fn().mockResolvedValue(null);

      const result = await AuthService.validateSession(getUserMock);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('invalid_session');
    });

    it('should fail validation and clear session if user is revoked', async () => {
      const revokedUser = { ...mockUser, authStatus: AuthStatus.Revoked };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(sessionData)
      );
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      const getUserMock = jest.fn().mockResolvedValue(revokedUser);

      const result = await AuthService.validateSession(getUserMock);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('revoked');
      expect(result.message).toContain('revocado');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_session');
    });

    it('should fail validation and clear session if device removed', async () => {
      const userWithoutDevice = {
        ...mockAuthenticatedUser,
        authorizedDevices: [
          {
            deviceId: 'different-device',
            deviceName: 'Different Device',
            authorizedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(sessionData)
      );
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      const getUserMock = jest.fn().mockResolvedValue(userWithoutDevice);

      const result = await AuthService.validateSession(getUserMock);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('device_removed');
      expect(result.message).toContain('no está autorizado');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_session');
    });

    it('should fail validation if user is not authenticated', async () => {
      const inactiveUser = { ...mockAuthenticatedUser, isActive: false };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(sessionData)
      );

      const getUserMock = jest.fn().mockResolvedValue(inactiveUser);

      const result = await AuthService.validateSession(getUserMock);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('invalid_session');
    });

    it('should handle network errors gracefully', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(sessionData)
      );

      const getUserMock = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await AuthService.validateSession(getUserMock);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('network_error');
    });
  });

  describe('hasActiveSession', () => {
    it('should return true if session exists', async () => {
      const sessionData: SessionData = {
        userId: 'user-123',
        deviceId: 'device-123',
        authenticatedAt: '2024-01-01T00:00:00.000Z',
        lastValidatedAt: '2024-01-01T00:00:00.000Z',
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(sessionData)
      );

      const result = await AuthService.hasActiveSession();

      expect(result).toBe(true);
    });

    it('should return false if no session exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await AuthService.hasActiveSession();

      expect(result).toBe(false);
    });
  });

  describe('getDeviceId', () => {
    it('should return device ID if exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('device-123');

      const result = await AuthService.getDeviceId();

      expect(result).toBe('device-123');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('device_id');
    });

    it('should return null if no device ID exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await AuthService.getDeviceId();

      expect(result).toBeNull();
    });
  });

  describe('revokeUser', () => {
    it('should revoke user successfully', async () => {
      const revokeServerMock = jest.fn().mockResolvedValue(true);

      const result = await AuthService.revokeUser('user-123', revokeServerMock);

      expect(result.success).toBe(true);
      expect(revokeServerMock).toHaveBeenCalledWith('user-123');
    });

    it('should fail if server revocation fails', async () => {
      const revokeServerMock = jest.fn().mockResolvedValue(false);

      const result = await AuthService.revokeUser('user-123', revokeServerMock);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error al revocar');
    });

    it('should handle server errors', async () => {
      const revokeServerMock = jest.fn().mockRejectedValue(new Error('Server error'));

      const result = await AuthService.revokeUser('user-123', revokeServerMock);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error al revocar');
    });
  });
});
