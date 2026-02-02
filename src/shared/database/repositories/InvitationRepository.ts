import { SQLiteDatabase } from 'expo-sqlite';
import {
  Invitation,
  InvitationStatus,
  UserRole,
} from '@/shared/types/entities';
import { IRepository } from './IRepository';

/**
 * Invitation creation data
 */
export interface CreateInvitationData {
  id: string;
  userId: string;
  token: string;
  role: UserRole;
  expiresAt: string;
  createdBy: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invitation update data
 */
export interface UpdateInvitationData {
  acceptedAt?: string;
  updatedAt?: string;
}

/**
 * Invitation Repository
 *
 * Handles all database operations for invitations.
 */
export class InvitationRepository implements IRepository<
  Invitation,
  CreateInvitationData,
  UpdateInvitationData
> {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Find invitation by ID
   */
  async findById(id: string): Promise<Invitation | null> {
    try {
      const result = await this.db.getFirstAsync<any>(
        'SELECT * FROM invitations WHERE id = ?',
        [id]
      );

      return result ? this.mapToInvitation(result) : null;
    } catch (error) {
      console.error('Error finding invitation by ID:', error);
      return null;
    }
  }

  /**
   * Find invitation by token
   */
  async findByToken(token: string): Promise<Invitation | null> {
    try {
      const result = await this.db.getFirstAsync<any>(
        'SELECT * FROM invitations WHERE token = ?',
        [token]
      );

      return result ? this.mapToInvitation(result) : null;
    } catch (error) {
      console.error('Error finding invitation by token:', error);
      return null;
    }
  }

  /**
   * Find invitation by user ID
   */
  async findByUserId(userId: string): Promise<Invitation | null> {
    try {
      const result = await this.db.getFirstAsync<any>(
        'SELECT * FROM invitations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [userId]
      );

      return result ? this.mapToInvitation(result) : null;
    } catch (error) {
      console.error('Error finding invitation by user ID:', error);
      return null;
    }
  }

  /**
   * Find all invitations
   */
  async findAll(): Promise<Invitation[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        'SELECT * FROM invitations ORDER BY created_at DESC'
      );

      return results.map((result) => this.mapToInvitation(result));
    } catch (error) {
      console.error('Error finding all invitations:', error);
      return [];
    }
  }

  /**
   * Find pending invitations (not accepted and not expired)
   */
  async findPending(): Promise<Invitation[]> {
    try {
      const now = new Date().toISOString();
      const results = await this.db.getAllAsync<any>(
        'SELECT * FROM invitations WHERE accepted_at IS NULL AND expires_at > ? ORDER BY created_at DESC',
        [now]
      );

      return results.map((result) => this.mapToInvitation(result));
    } catch (error) {
      console.error('Error finding pending invitations:', error);
      return [];
    }
  }

  /**
   * Create a new invitation
   */
  async create(data: CreateInvitationData): Promise<Invitation> {
    try {
      await this.db.runAsync(
        `INSERT INTO invitations (
          id, user_id, token, role, expires_at, created_by, accepted_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.userId,
          data.token,
          data.role,
          data.expiresAt,
          data.createdBy,
          data.acceptedAt ?? null,
          data.createdAt,
          data.updatedAt,
        ]
      );

      const invitation = await this.findById(data.id);
      if (!invitation) {
        throw new Error('Failed to retrieve created invitation');
      }

      return invitation;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  /**
   * Update an existing invitation
   */
  async update(id: string, data: UpdateInvitationData): Promise<Invitation> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.acceptedAt !== undefined) {
        updates.push('accepted_at = ?');
        values.push(data.acceptedAt ?? null);
      }

      if (data.updatedAt !== undefined) {
        updates.push('updated_at = ?');
        values.push(data.updatedAt);
      }

      if (updates.length === 0) {
        const invitation = await this.findById(id);
        if (!invitation) {
          throw new Error('Invitation not found');
        }
        return invitation;
      }

      values.push(id);

      await this.db.runAsync(
        `UPDATE invitations SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const invitation = await this.findById(id);
      if (!invitation) {
        throw new Error('Failed to retrieve updated invitation');
      }

      return invitation;
    } catch (error) {
      console.error('Error updating invitation:', error);
      throw error;
    }
  }

  /**
   * Delete an invitation by ID
   */
  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM invitations WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting invitation:', error);
      throw error;
    }
  }

  /**
   * Check if invitation exists by ID
   */
  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM invitations WHERE id = ?',
        [id]
      );

      return (result?.count ?? 0) > 0;
    } catch (error) {
      console.error('Error checking invitation existence:', error);
      return false;
    }
  }

  /**
   * Check if invitation exists by token
   */
  async existsByToken(token: string): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM invitations WHERE token = ?',
        [token]
      );

      return (result?.count ?? 0) > 0;
    } catch (error) {
      console.error('Error checking invitation existence by token:', error);
      return false;
    }
  }

  /**
   * Upsert invitation (insert or replace)
   * Used for Firebase sync operations
   */
  async upsert(data: CreateInvitationData): Promise<Invitation> {
    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO invitations (
          id, user_id, token, role, expires_at, created_by, accepted_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.userId,
          data.token,
          data.role,
          data.expiresAt,
          data.createdBy,
          data.acceptedAt ?? null,
          data.createdAt,
          data.updatedAt,
        ]
      );

      const invitation = await this.findById(data.id);
      if (!invitation) {
        throw new Error('Failed to retrieve upserted invitation');
      }

      return invitation;
    } catch (error) {
      console.error('Error upserting invitation:', error);
      throw error;
    }
  }

  /**
   * Map database record to Invitation domain model
   */
  private mapToInvitation(dbRecord: any): Invitation {
    return {
      id: dbRecord.id,
      userId: dbRecord.user_id,
      token: dbRecord.token,
      status: dbRecord.status as InvitationStatus,
      expiresAt: dbRecord.expires_at,
      createdBy: dbRecord.created_by,
      acceptedAt: dbRecord.accepted_at || undefined,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }
}
