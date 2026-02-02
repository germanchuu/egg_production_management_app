import { SQLiteDatabase } from 'expo-sqlite';
import { User, UserRole, AuthStatus } from '@/shared/types/entities';
import { IRepository } from './IRepository';
import { UserMapper } from '@/features/auth/mappers/UserMapper';

/**
 * User creation data
 */
export interface CreateUserData {
  id: string;
  displayName: string;
  role: UserRole;
  authStatus: AuthStatus;
  authorizedDevices: string[];
  isActive: boolean;
  invitationId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User update data
 */
export interface UpdateUserData {
  displayName?: string;
  role?: UserRole;
  authStatus?: AuthStatus;
  authorizedDevices?: string[];
  isActive?: boolean;
  invitationId?: string;
  lastAccessAt?: string;
  updatedAt?: string;
}

/**
 * User Repository
 *
 * Handles all database operations for users.
 * Separates data access from business logic.
 */
export class UserRepository
  implements IRepository<User, CreateUserData, UpdateUserData>
{
  constructor(private db: SQLiteDatabase) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const result = await this.db.getFirstAsync<any>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );

      return result ? this.mapToUser(result) : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  /**
   * Find user by display name
   */
  async findByDisplayName(displayName: string): Promise<User | null> {
    try {
      const result = await this.db.getFirstAsync<any>(
        'SELECT * FROM users WHERE display_name = ?',
        [displayName]
      );

      return result ? this.mapToUser(result) : null;
    } catch (error) {
      console.error('Error finding user by display name:', error);
      return null;
    }
  }

  /**
   * Find all users
   */
  async findAll(): Promise<User[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        'SELECT * FROM users ORDER BY created_at DESC'
      );

      return results.map((result) => this.mapToUser(result));
    } catch (error) {
      console.error('Error finding all users:', error);
      return [];
    }
  }

  /**
   * Find users by authentication status
   */
  async findByStatus(status: AuthStatus): Promise<User[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        'SELECT * FROM users WHERE auth_status = ? ORDER BY created_at DESC',
        [status]
      );

      return results.map((result) => this.mapToUser(result));
    } catch (error) {
      console.error('Error finding users by status:', error);
      return [];
    }
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole): Promise<User[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        'SELECT * FROM users WHERE role = ? ORDER BY created_at DESC',
        [role]
      );

      return results.map((result) => this.mapToUser(result));
    } catch (error) {
      console.error('Error finding users by role:', error);
      return [];
    }
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserData): Promise<User> {
    try {
      await this.db.runAsync(
        `INSERT INTO users (
          id, display_name, role, auth_status, authorized_devices,
          is_active, invitation_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.displayName,
          data.role,
          data.authStatus,
          JSON.stringify(data.authorizedDevices),
          data.isActive ? 1 : 0,
          data.invitationId ?? null,
          data.createdAt,
          data.updatedAt,
        ]
      );

      const user = await this.findById(data.id);
      if (!user) {
        throw new Error('Failed to retrieve created user');
      }

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.displayName !== undefined) {
        updates.push('display_name = ?');
        values.push(data.displayName);
      }

      if (data.role !== undefined) {
        updates.push('role = ?');
        values.push(data.role);
      }

      if (data.authStatus !== undefined) {
        updates.push('auth_status = ?');
        values.push(data.authStatus);
      }

      if (data.authorizedDevices !== undefined) {
        updates.push('authorized_devices = ?');
        values.push(JSON.stringify(data.authorizedDevices));
      }

      if (data.isActive !== undefined) {
        updates.push('is_active = ?');
        values.push(data.isActive ? 1 : 0);
      }

      if (data.invitationId !== undefined) {
        updates.push('invitation_id = ?');
        values.push(data.invitationId ?? null);
      }

      if (data.lastAccessAt !== undefined) {
        updates.push('last_access_at = ?');
        values.push(data.lastAccessAt ?? null);
      }

      if (data.updatedAt !== undefined) {
        updates.push('updated_at = ?');
        values.push(data.updatedAt);
      }

      if (updates.length === 0) {
        // No updates, just return current user
        const user = await this.findById(id);
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      }

      values.push(id);

      await this.db.runAsync(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const user = await this.findById(id);
      if (!user) {
        throw new Error('Failed to retrieve updated user');
      }

      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user by ID
   */
  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM users WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Check if user exists by ID
   */
  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM users WHERE id = ?',
        [id]
      );

      return (result?.count ?? 0) > 0;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  /**
   * Check if user exists by display name
   */
  async existsByDisplayName(displayName: string): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM users WHERE display_name = ?',
        [displayName]
      );

      return (result?.count ?? 0) > 0;
    } catch (error) {
      console.error('Error checking user existence by display name:', error);
      return false;
    }
  }

  /**
   * Upsert user (insert or replace)
   * Used for Firebase sync operations
   */
  async upsert(data: CreateUserData): Promise<User> {
    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO users (
          id, display_name, role, auth_status, authorized_devices,
          is_active, invitation_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.displayName,
          data.role,
          data.authStatus,
          JSON.stringify(data.authorizedDevices),
          data.isActive ? 1 : 0,
          data.invitationId ?? null,
          data.createdAt,
          data.updatedAt,
        ]
      );

      const user = await this.findById(data.id);
      if (!user) {
        throw new Error('Failed to retrieve upserted user');
      }

      return user;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  /**
   * Map database record to User domain model
   */
  private mapToUser(dbRecord: any): User {
    return UserMapper.toDomain(dbRecord);
  }
}
