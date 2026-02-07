/**
 * Authentication Service
 *
 * Handles user authentication, session management, and validation.
 * Uses expo-secure-store for encrypted session storage.
 *
 * Key responsibilities:
 * - Accept invitations and create local sessions
 * - Store and retrieve session data securely
 * - Validate sessions with Firestore (when online)
 * - Handle user revocation
 * - Manage device authorization
 */

import * as SecureStore from 'expo-secure-store';
import { SessionData, User, AuthStatus } from '@/shared/types/entities';
import { UserValidator } from '@/features/auth/models/User';

/**
 * Secure store keys
 */
const STORAGE_KEYS = {
  SESSION: 'auth_session',
  DEVICE_ID: 'device_id',
} as const;

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

/**
 * Session validation result
 */
export interface SessionValidationResult {
  valid: boolean;
  error?: 'revoked' | 'device_removed' | 'network_error' | 'invalid_session';
  message?: string;
}

/**
 * Authentication Service
 */
export class AuthService {
  /**
   * Accept invitation and create local session
   *
   * @param user - User object from Firestore after invitation acceptance
   * @param deviceName - Name of current device (e.g., "iPhone 12")
   * @returns Authentication result with success status
   */
  static async acceptInvitation(user: User, deviceName: string): Promise<AuthResult> {
    try {
      // Validate user can accept invitation
      if (!UserValidator.canAcceptInvitation(user)) {
        return {
          success: false,
          error: 'El usuario no puede aceptar la invitación. Verifica el estado del usuario.',
        };
      }

      // Generate or retrieve device ID
      const deviceId = await AuthService.getOrCreateDeviceId();

      // Add device to user's authorized devices using UserService
      const { UserServiceProvider } = await import('./UserServiceProvider');
      const userService = await UserServiceProvider.getUserService();
      const result = await userService.addAuthorizedDevice(
        user.id,
        deviceId,
        deviceName
      );

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Error al autorizar el dispositivo',
        };
      }

      // Create session data
      const sessionData: SessionData = {
        userId: user.id,
        deviceId,
        authenticatedAt: new Date().toISOString(),
        lastValidatedAt: new Date().toISOString(),
      };

      // Store session securely
      await AuthService.storeSession(sessionData);

      return {
        success: true,
        user: result.data, // Return updated user with device
      };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return {
        success: false,
        error: 'Error al aceptar la invitación. Por favor intenta de nuevo.',
      };
    }
  }

  /**
   * Create session for already authenticated user (direct login)
   *
   * Used for admin login where user is already authenticated in Firestore.
   * Unlike acceptInvitation, this doesn't validate pending status.
   *
   * @param user - Authenticated user object
   * @param deviceName - Name of current device
   * @returns Authentication result with success status
   */
  static async createSession(user: User, deviceName: string): Promise<AuthResult> {
    try {
      // Generate or retrieve device ID
      const deviceId = await AuthService.getOrCreateDeviceId();

      // Check if device is already authorized
      const hasDevice = UserValidator.hasDevice(user, deviceId);

      // If device not authorized, add it
      if (!hasDevice) {
        const { UserServiceProvider } = await import('./UserServiceProvider');
        const userService = await UserServiceProvider.getUserService();
        const result = await userService.addAuthorizedDevice(
          user.id,
          deviceId,
          deviceName
        );

        if (!result.success || !result.data) {
          return {
            success: false,
            error: result.error || 'Error al autorizar el dispositivo',
          };
        }

        // Update user with new device
        user = result.data;
      }

      // Create session data
      const sessionData: SessionData = {
        userId: user.id,
        deviceId,
        authenticatedAt: new Date().toISOString(),
        lastValidatedAt: new Date().toISOString(),
      };

      // Store session securely
      await AuthService.storeSession(sessionData);

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('Error creating session:', error);
      return {
        success: false,
        error: 'Error al crear la sesión. Por favor intenta de nuevo.',
      };
    }
  }

  /**
   * Logout and clear local session
   */
  static async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.SESSION);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  /**
   * Validate session with Firestore (when online)
   *
   * Checks if:
   * - User still exists in Firestore
   * - User is not revoked
   * - Device is still in authorizedDevices list
   *
   * @param getUserFromFirestore - Function to fetch user from Firestore
   * @returns Validation result with status and error details
   */
  static async validateSession(
    getUserFromFirestore: (userId: string) => Promise<User | null>
  ): Promise<SessionValidationResult> {
    try {
      // Get stored session
      const session = await AuthService.getStoredSession();

      if (!session) {
        return {
          valid: false,
          error: 'invalid_session',
          message: 'No hay sesión activa',
        };
      }

      // Fetch user from Firestore
      const user = await getUserFromFirestore(session.userId);

      if (!user) {
        return {
          valid: false,
          error: 'invalid_session',
          message: 'Usuario no encontrado',
        };
      }

      // Check if user is revoked
      if (UserValidator.isRevoked(user)) {
        // Clear local session
        await AuthService.logout();
        return {
          valid: false,
          error: 'revoked',
          message: 'Tu acceso ha sido revocado. Contacta al administrador.',
        };
      }

      // Check if device is still authorized
      if (!UserValidator.hasDevice(user, session.deviceId)) {
        // Clear local session
        await AuthService.logout();
        return {
          valid: false,
          error: 'device_removed',
          message: 'Este dispositivo ya no está autorizado. Contacta al administrador.',
        };
      }

      // Check if user is authenticated and active
      if (!UserValidator.isAuthenticated(user)) {
        return {
          valid: false,
          error: 'invalid_session',
          message: 'Usuario no autenticado o inactivo',
        };
      }

      // Update last validated timestamp
      const updatedSession: SessionData = {
        ...session,
        lastValidatedAt: new Date().toISOString(),
      };
      await AuthService.storeSession(updatedSession);

      return {
        valid: true,
      };
    } catch (error) {
      console.error('Error validating session:', error);
      return {
        valid: false,
        error: 'network_error',
        message: 'Error de red al validar sesión',
      };
    }
  }

  /**
   * Get stored session from secure storage
   *
   * @returns Session data if exists, null otherwise
   */
  static async getStoredSession(): Promise<SessionData | null> {
    try {
      const sessionJson = await SecureStore.getItemAsync(STORAGE_KEYS.SESSION);

      if (!sessionJson) {
        return null;
      }

      return JSON.parse(sessionJson) as SessionData;
    } catch (error) {
      console.error('Error retrieving session:', error);
      return null;
    }
  }

  /**
   * Store session data securely
   *
   * @param session - Session data to store
   */
  static async storeSession(session: SessionData): Promise<void> {
    try {
      const sessionJson = JSON.stringify(session);
      await SecureStore.setItemAsync(STORAGE_KEYS.SESSION, sessionJson);
    } catch (error) {
      console.error('Error storing session:', error);
      throw error;
    }
  }

  /**
   * Check if user has active session
   *
   * @returns True if session exists, false otherwise
   */
  static async hasActiveSession(): Promise<boolean> {
    const session = await AuthService.getStoredSession();
    return session !== null;
  }

  /**
   * Get or create device ID
   * Device ID is generated once and persisted
   *
   * @returns Device ID (UUID)
   */
  private static async getOrCreateDeviceId(): Promise<string> {
    try {
      // Try to get existing device ID
      let deviceId = await SecureStore.getItemAsync(STORAGE_KEYS.DEVICE_ID);

      if (!deviceId) {
        // Generate new device ID (UUID v4)
        deviceId = AuthService.generateUUID();
        await SecureStore.setItemAsync(STORAGE_KEYS.DEVICE_ID, deviceId);
      }

      return deviceId;
    } catch (error) {
      console.error('Error getting/creating device ID:', error);
      throw error;
    }
  }

  /**
   * Get current device ID
   *
   * @returns Device ID if exists, null otherwise
   */
  static async getDeviceId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.DEVICE_ID);
    } catch (error) {
      console.error('Error getting device ID:', error);
      return null;
    }
  }

  /**
   * Generate UUID v4
   * Simple implementation for device ID generation
   */
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Login admin user from Firestore (first-time setup)
   *
   * Authenticates admin using only the access code (User ID).
   * The access code is the Firestore document ID, which is a secure UUID.
   *
   * @param accessCode - Admin user's access code (Firestore document ID)
   * @param deviceName - Current device name
   * @param firestore - Firestore instance
   * @returns Authentication result with user data
   */
  static async loginAdminFromFirestore(
    accessCode: string,
    deviceName: string,
    firestore: any // Firestore type
  ): Promise<AuthResult> {
    try {
      // Import Firestore dependencies
      const { doc, getDoc } = await import('firebase/firestore');
      const { getDatabase } = await import('@/shared/database');
      const { UserRepository } = await import(
        '@/shared/database/repositories'
      );
      const { UserRole, AuthStatus } = await import('@/shared/types/entities');

      // Validate input
      if (!accessCode.trim()) {
        return {
          success: false,
          error: 'Debes ingresar el código de acceso.',
        };
      }

      // Get database
      const db = await getDatabase();
      const userRepo = new UserRepository(db);

      // Check if user exists locally first
      const localUser = await userRepo.findById(accessCode.trim());
      if (localUser) {
        // User already synced, create session directly
        const result = await AuthService.createSession(localUser, deviceName);
        return result;
      }

      // Fetch user from Firestore by document ID (access code)
      const userDocRef = doc(firestore, 'users', accessCode.trim());
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        return {
          success: false,
          error:
            'Código de acceso inválido. Verifica que hayas ingresado el código correcto.',
        };
      }

      const firestoreData = userDoc.data();

      // Security check: Verify user is admin
      if (firestoreData.role !== 'admin') {
        return {
          success: false,
          error: 'Este código no corresponde a una cuenta de administrador.',
        };
      }

      // Security check: Verify user is authenticated
      if (firestoreData.authStatus !== 'authenticated') {
        return {
          success: false,
          error: 'Esta cuenta no está activa. Contacta al soporte.',
        };
      }

      // Security check: Verify user is active
      if (!firestoreData.isActive) {
        return {
          success: false,
          error: 'Esta cuenta ha sido desactivada.',
        };
      }

      // Map Firestore data to User entity
      const adminUser: User = {
        id: userDoc.id,
        displayName: firestoreData.displayName,
        role: firestoreData.role === 'admin' ? UserRole.Admin : UserRole.User,
        authStatus: AuthStatus.Authenticated,
        authorizedDevices: Array.isArray(firestoreData.authorizedDevices)
          ? firestoreData.authorizedDevices
          : [],
        isActive: firestoreData.isActive ?? true,
        createdAt: firestoreData.createdAt,
        updatedAt: firestoreData.updatedAt,
      };

      // Save to local DB
      await userRepo.create(adminUser);

      // Create session and authorize device (direct login)
      const result = await AuthService.createSession(adminUser, deviceName);
      return result;
    } catch (error) {
      console.error('Error logging in admin from Firestore:', error);
      return {
        success: false,
        error:
          'No se pudo iniciar sesión. Verifica tu conexión a internet e intenta de nuevo.',
      };
    }
  }

  /**
   * Revoke user access (admin only, handled server-side)
   *
   * This method is a placeholder for the client-side call.
   * Actual revocation logic happens in Firebase Functions.
   *
   * @param userId - User ID to revoke
   * @param revokeUserOnServer - Function to call server-side revocation
   * @returns Success status
   */
  static async revokeUser(
    userId: string,
    revokeUserOnServer: (userId: string) => Promise<boolean>
  ): Promise<AuthResult> {
    try {
      const success = await revokeUserOnServer(userId);

      if (!success) {
        return {
          success: false,
          error: 'Error al revocar el usuario',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error revoking user:', error);
      return {
        success: false,
        error: 'Error al revocar el usuario. Por favor intenta de nuevo.',
      };
    }
  }
}
