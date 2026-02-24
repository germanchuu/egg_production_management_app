/**
 * User Service
 *
 * Handles user management operations (CRUD).
 * Admin-only operations for creating, updating, and managing users.
 *
 * Key responsibilities:
 * - Create new users (pending state)
 * - Update user information (name, role)
 * - List all users with authentication status
 * - Delete users (soft delete via revocation)
 * - Sync with Firebase when online
 */

import { User, UserRole, AuthStatus } from '@/shared/types/entities';
import { generateId } from '@/shared/utils/id';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { UserRepository } from '@/shared/database/repositories';

/**
 * User creation input
 */
export interface CreateUserInput {
  displayName: string;
  role: UserRole;
  createdBy: string; // Admin user ID
}

/**
 * User update input
 */
export interface UpdateUserInput {
  id: string;
  displayName?: string;
  role?: UserRole;
}

/**
 * User service result
 */
export interface UserServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * User Service
 */
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private syncQueue: SyncQueue
  ) {}

  /**
   * Create a new user (admin only)
   *
   * Creates user in pending state. Admin must generate invitation
   * for user to accept and authenticate.
   *
   * @param input - User creation data
   * @returns Created user or error
   */
  async createUser(input: CreateUserInput): Promise<UserServiceResult<User>> {
    try {
      // 1. Validate unique display name
      const exists = await this.userRepository.existsByDisplayName(
        input.displayName
      );
      if (exists) {
        return {
          success: false,
          error: 'Ya existe un usuario con ese nombre',
        };
      }

      // 2. Create user
      const userId = generateId();
      const now = new Date().toISOString();

      const user = await this.userRepository.create({
        id: userId,
        displayName: input.displayName,
        role: input.role,
        authStatus: AuthStatus.Pending,
        authorizedDevices: [],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      // 3. Enqueue for sync (IMPORTANT: 'users' not 'user')
      await this.syncQueue.enqueue({
        entityType: 'users',
        entityId: user.id,
        operation: 'CREATE',
      });

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: 'Error al crear el usuario. Por favor intenta de nuevo.',
      };
    }
  }

  /**
   * Update user information (admin only)
   *
   * @param input - User update data
   * @returns Updated user or error
   */
  async updateUser(input: UpdateUserInput): Promise<UserServiceResult<User>> {
    try {
      if (!input.displayName && !input.role) {
        return {
          success: false,
          error: 'No hay cambios para actualizar',
        };
      }

      const now = new Date().toISOString();

      const user = await this.userRepository.update(input.id, {
        displayName: input.displayName,
        role: input.role,
        updatedAt: now,
      });

      await this.syncQueue.enqueue({
        entityType: 'users',
        entityId: user.id,
        operation: 'UPDATE',
      });

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: 'Error al actualizar el usuario. Por favor intenta de nuevo.',
      };
    }
  }

  /**
   * Get user by ID
   *
   * @param userId - User ID
   * @returns User or null
   */
  async getUser(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  /**
   * List all users (admin only)
   *
   * @returns Array of users
   */
  async listAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  /**
   * Get users by authentication status
   *
   * @param status - Authentication status filter
   * @returns Array of users with matching status
   */
  async getUsersByStatus(status: AuthStatus): Promise<User[]> {
    return this.userRepository.findByStatus(status);
  }

  /**
   * Check if user exists by display name (for validation)
   *
   * @param displayName - User display name
   * @returns True if user exists
   */
  async userExistsByName(displayName: string): Promise<boolean> {
    return this.userRepository.existsByDisplayName(displayName);
  }

  /**
   * Add authorized device to user
   *
   * Adds a device to the user's authorized devices list and updates
   * auth status to Authenticated if user is in Pending state.
   *
   * @param userId - User ID
   * @param deviceId - Device ID (UUID)
   * @param deviceName - Device name (e.g., "iPhone 12")
   * @returns Updated user or error
   */
  async addAuthorizedDevice(
    userId: string,
    deviceId: string,
    deviceName: string
  ): Promise<UserServiceResult<User>> {
    try {
      // 1. Get current user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'Usuario no encontrado',
        };
      }

      // 2. Check if device already exists
      const deviceExists = user.authorizedDevices?.some(
        d => d.deviceId === deviceId
      );
      if (deviceExists) {
        // Device already authorized, return success
        return {
          success: true,
          data: user,
        };
      }

      // 3. Create authorized device entry
      const authorizedDevice = {
        deviceId,
        deviceName,
        authorizedAt: new Date().toISOString(),
      };

      // 4. Add device to list
      const updatedDevices = [
        ...(user.authorizedDevices || []),
        authorizedDevice,
      ];

      // 5. Update user with new device and auth status
      const now = new Date().toISOString();
      const updatedUser = await this.userRepository.update(userId, {
        authorizedDevices: updatedDevices,
        authStatus:
          user.authStatus === AuthStatus.Pending
            ? AuthStatus.Authenticated
            : user.authStatus,
        updatedAt: now,
      });

      // 6. Enqueue for sync
      await this.syncQueue.enqueue({
        entityType: 'users',
        entityId: userId,
        operation: 'UPDATE',
      });

      return {
        success: true,
        data: updatedUser,
      };
    } catch (error) {
      console.error('Error adding authorized device:', error);
      return {
        success: false,
        error: 'Error al autorizar el dispositivo. Por favor intenta de nuevo.',
      };
    }
  }
}
