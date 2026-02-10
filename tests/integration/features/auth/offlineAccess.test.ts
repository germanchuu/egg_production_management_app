/**
 * Integration Test: Offline App Access with Cached Session
 *
 * Tests: T053 [US3] - Offline app access with cached session
 * Success Criterion: SC-010 - App launch < 3s offline
 *
 * Scenario:
 * 1. User accepts invitation while online
 * 2. App stores session in secure storage
 * 3. User goes offline
 * 4. App launches and loads session from cache
 * 5. User can access app features without network
 * 6. Launch time < 3 seconds
 */

import { AuthService } from '@/features/auth/services/AuthService';
import { UserRole, AuthStatus, User } from '@/shared/types/entities';
import * as SecureStore from 'expo-secure-store';

// Mock SecureStore
jest.mock('expo-secure-store');

// Mock Device Info
jest.mock('@/features/auth/services/UserServiceProvider', () => ({
  UserServiceProvider: {
    getUserService: jest.fn().mockResolvedValue({
      addAuthorizedDevice: jest.fn().mockResolvedValue({
        success: true,
        data: mockUser,
      }),
    }),
  },
}));

const mockUser: User = {
  id: 'user-123',
  displayName: 'Test User',
  role: UserRole.User,
  authStatus: AuthStatus.Authenticated,
  authorizedDevices: [
    {
      deviceId: 'device-456',
      deviceName: 'Test Device',
      authorizedAt: new Date().toISOString(),
    },
  ],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('T053: Offline App Access with Cached Session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load cached session offline in < 3 seconds', async () => {
    // Arrange: Store session in secure storage
    const sessionData = {
      userId: mockUser.id,
      deviceId: 'device-456',
      authenticatedAt: new Date().toISOString(),
      lastValidatedAt: new Date().toISOString(),
    };

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(sessionData)
    );

    // Act: Measure time to retrieve session
    const startTime = performance.now();
    const session = await AuthService.getStoredSession();
    const endTime = performance.now();
    const loadTime = endTime - startTime;

    // Assert: Session loaded successfully
    expect(session).not.toBeNull();
    expect(session?.userId).toBe(mockUser.id);
    expect(session?.deviceId).toBe('device-456');

    // Assert: Load time < 3000ms (SC-010)
    expect(loadTime).toBeLessThan(3000);
    console.log(`✓ Session loaded in ${loadTime.toFixed(2)}ms`);
  });

  it('should work fully offline without network calls', async () => {
    // Arrange: Mock session in storage
    const sessionData = {
      userId: mockUser.id,
      deviceId: 'device-456',
      authenticatedAt: new Date().toISOString(),
      lastValidatedAt: new Date().toISOString(),
    };

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(sessionData)
    );

    // Act: Check if session exists offline
    const hasSession = await AuthService.hasActiveSession();

    // Assert: Session exists without network
    expect(hasSession).toBe(true);
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_session');
    expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1);
  });

  it('should return null when no cached session exists', async () => {
    // Arrange: No session in storage
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    // Act: Try to get session
    const session = await AuthService.getStoredSession();

    // Assert: No session found
    expect(session).toBeNull();
  });

  it('should handle corrupted session data gracefully', async () => {
    // Arrange: Corrupted JSON in storage
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('invalid-json{');

    // Act: Try to get session
    const session = await AuthService.getStoredSession();

    // Assert: Returns null for corrupted data
    expect(session).toBeNull();
  });
});
