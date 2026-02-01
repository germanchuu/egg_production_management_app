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

import { SQLiteDatabase } from 'expo-sqlite';
import { User, UserRole, AuthStatus } from '@/shared/types/entities';
import { generateId } from '@/shared/utils/id';
import { SyncQueue } from '@/shared/sync/SyncQueue';

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
  /**
   * Create a new user (admin only)
   *
   * Creates user in pending state. Admin must generate invitation
   * for user to accept and authenticate.
   *
   * @param db - SQLite database instance
   * @param input - User creation data
   * @returns Created user or error
   */
  static async createUser(
    db: SQLiteDatabase,
    input: CreateUserInput
  ): Promise<UserServiceResult<User>> {
    try {
      const userId = generateId();
      const now = new Date().toISOString();

      const user: User = {
        id: userId,
        displayName: input.displayName,
        role: input.role,
        authStatus: AuthStatus.Pending,
        authorizedDevices: [],
        isActive: true,
        invitationId: undefined,
        createdAt: now,
        updatedAt: now,
      };

      // Insert into local database
      await db.runAsync(
        `INSERT INTO users (
          id, display_name, role, auth_status, authorized_devices,
          is_active, invitation_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.displayName,
          user.role,
          user.authStatus,
          JSON.stringify(user.authorizedDevices),
          user.isActive ? 1 : 0,
          user.invitationId ?? null,
          user.createdAt,
          user.updatedAt,
        ]
      );

      // Add to sync queue
      const syncQueue = new SyncQueue(db);
      await syncQueue.enqueue({
        entityType: 'user',
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
   * @param db - SQLite database instance
   * @param input - User update data
   * @returns Updated user or error
   */
  static async updateUser(
    db: SQLiteDatabase,
    input: UpdateUserInput
  ): Promise<UserServiceResult<User>> {
    try {
      const now = new Date().toISOString();

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      if (input.displayName !== undefined) {
        updates.push('display_name = ?');
        values.push(input.displayName);
      }

      if (input.role !== undefined) {
        updates.push('role = ?');
        values.push(input.role);
      }

      if (updates.length === 0) {
        return {
          success: false,
          error: 'No hay cambios para actualizar',
        };
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(input.id);

      // Update in local database
      await db.runAsync(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      // Get updated user
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM users WHERE id = ?',
        [input.id]
      );

      if (!result) {
        return {
          success: false,
          error: 'Usuario no encontrado',
        };
      }

      const user: User = {
        id: result.id,
        displayName: result.display_name,
        role: result.role as UserRole,
        authStatus: result.auth_status as AuthStatus,
        authorizedDevices: JSON.parse(result.authorized_devices || '[]'),
        isActive: Boolean(result.is_active),
        invitationId: result.invitation_id || undefined,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      };

      // Add to sync queue
      const syncQueue = new SyncQueue(db);
      await syncQueue.enqueue({
        entityType: 'user',
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
   * @param db - SQLite database instance
   * @param userId - User ID
   * @returns User or null
   */
  static async getUser(
    db: SQLiteDatabase,
    userId: string
  ): Promise<User | null> {
    try {
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        displayName: result.display_name,
        role: result.role as UserRole,
        authStatus: result.auth_status as AuthStatus,
        authorizedDevices: JSON.parse(result.authorized_devices || '[]'),
        isActive: Boolean(result.is_active),
        invitationId: result.invitation_id || undefined,
        lastAccessAt: result.last_access_at || undefined,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * List all users (admin only)
   *
   * @param db - SQLite database instance
   * @returns Array of users
   */
  static async listAllUsers(db: SQLiteDatabase): Promise<User[]> {
    try {
      const results = await db.getAllAsync<any>(
        'SELECT * FROM users ORDER BY created_at DESC'
      );

      return results.map((result) => ({
        id: result.id,
        displayName: result.display_name,
        role: result.role as UserRole,
        authStatus: result.auth_status as AuthStatus,
        authorizedDevices: JSON.parse(result.authorized_devices || '[]'),
        isActive: Boolean(result.is_active),
        invitationId: result.invitation_id || undefined,
        lastAccessAt: result.last_access_at || undefined,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      }));
    } catch (error) {
      console.error('Error listing users:', error);
      return [];
    }
  }

  /**
   * Get users by authentication status
   *
   * @param db - SQLite database instance
   * @param status - Authentication status filter
   * @returns Array of users with matching status
   */
  static async getUsersByStatus(
    db: SQLiteDatabase,
    status: AuthStatus
  ): Promise<User[]> {
    try {
      const results = await db.getAllAsync<any>(
        'SELECT * FROM users WHERE auth_status = ? ORDER BY created_at DESC',
        [status]
      );

      return results.map((result) => ({
        id: result.id,
        displayName: result.display_name,
        role: result.role as UserRole,
        authStatus: result.auth_status as AuthStatus,
        authorizedDevices: JSON.parse(result.authorized_devices || '[]'),
        isActive: Boolean(result.is_active),
        invitationId: result.invitation_id || undefined,
        lastAccessAt: result.last_access_at || undefined,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      }));
    } catch (error) {
      console.error('Error getting users by status:', error);
      return [];
    }
  }

  /**
   * Check if user exists by display name (for validation)
   *
   * @param db - SQLite database instance
   * @param displayName - User display name
   * @returns True if user exists
   */
  static async userExistsByName(
    db: SQLiteDatabase,
    displayName: string
  ): Promise<boolean> {
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM users WHERE display_name = ?',
        [displayName]
      );

      return (result?.count ?? 0) > 0;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  /**
   * Gets a status label in Spanish
   */
  static getStatusLabel(status: AuthStatus): string {
    switch (status) {
      case AuthStatus.Pending:
        return 'Pendiente';
      case AuthStatus.Authenticated:
        return 'Autenticado';
      case AuthStatus.Revoked:
        return 'Revocado';
      default:
        return status;
    }
  }

  /**
   * Gets a role label in Spanish
   */
  static getRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.Admin:
        return 'Administrador';
      case UserRole.User:
        return 'Usuario';
      default:
        return role;
    }
  }

  /**
   * Gets status color for UI
   */
  static getStatusColor(status: AuthStatus): string {
    switch (status) {
      case AuthStatus.Pending:
        return '#FFB300'; // Amber
      case AuthStatus.Authenticated:
        return '#66BB6A'; // Success green
      case AuthStatus.Revoked:
        return '#DC2626'; // Error red
      default:
        return '#9E9E9E'; // Gray
    }
  }
}
