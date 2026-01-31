/**
 * User Model
 *
 * Represents system users (administrators and standard users).
 * Authentication uses invitation-based system with deep links.
 * Supports multi-device access (max 3 devices per user).
 *
 * This model extends the shared User entity type with auth-specific
 * business logic and validation.
 */

import {
  User as UserEntity,
  UserRole,
  AuthStatus,
  AuthorizedDevice,
} from '@/shared/types/entities';

/**
 * Re-export shared types for convenience
 */
export { UserRole, AuthStatus, type AuthorizedDevice };

/**
 * User model interface (extends shared entity)
 */
export type User = UserEntity;

/**
 * User creation input (for creating new users)
 */
export interface CreateUserInput {
  displayName: string;
  role: UserRole;
}

/**
 * User update input (for updating user profile)
 */
export interface UpdateUserInput {
  displayName?: string;
  lastAccessAt?: string;
}

/**
 * User validation helper functions
 */
export class UserValidator {
  /**
   * Validates display name
   */
  static isValidDisplayName(name: string): boolean {
    return name.length >= 2 && name.length <= 100;
  }

  /**
   * Validates if user can be revoked
   * Admins can only be revoked by other admins
   */
  static canRevoke(targetUser: User, currentUser: User): boolean {
    if (targetUser.role === UserRole.Admin) {
      return currentUser.role === UserRole.Admin && currentUser.id !== targetUser.id;
    }
    return currentUser.role === UserRole.Admin;
  }

  /**
   * Validates if user can accept invitation
   */
  static canAcceptInvitation(user: User): boolean {
    return user.authStatus === AuthStatus.Pending;
  }

  /**
   * Validates if user is authenticated and active
   */
  static isAuthenticated(user: User): boolean {
    return (
      user.authStatus === AuthStatus.Authenticated &&
      user.isActive
    );
  }

  /**
   * Validates if user is revoked (permanently blocked)
   */
  static isRevoked(user: User): boolean {
    return user.authStatus === AuthStatus.Revoked;
  }

  /**
   * Validates if user can add more devices
   */
  static canAddDevice(user: User): boolean {
    const deviceCount = user.authorizedDevices?.length ?? 0;
    return deviceCount < 3;
  }

  /**
   * Validates if device exists in user's authorized devices
   */
  static hasDevice(user: User, deviceId: string): boolean {
    return (
      user.authorizedDevices?.some((device) => device.deviceId === deviceId) ??
      false
    );
  }
}

/**
 * User status helper functions
 */
export class UserStatus {
  /**
   * Get human-readable status label
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
        return 'Desconocido';
    }
  }

  /**
   * Get human-readable role label
   */
  static getRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.Admin:
        return 'Administrador';
      case UserRole.User:
        return 'Usuario';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Check if status transition is valid
   */
  static isValidTransition(from: AuthStatus, to: AuthStatus): boolean {
    // Revoked is permanent - cannot transition from revoked
    if (from === AuthStatus.Revoked) {
      return false;
    }

    // Valid transitions:
    // pending -> authenticated (user accepts invitation)
    // pending -> revoked (admin revokes before acceptance)
    // authenticated -> revoked (admin revokes authenticated user)
    const validTransitions: Record<AuthStatus, AuthStatus[]> = {
      [AuthStatus.Pending]: [AuthStatus.Authenticated, AuthStatus.Revoked],
      [AuthStatus.Authenticated]: [AuthStatus.Revoked],
      [AuthStatus.Revoked]: [], // Revoked is terminal state
    };

    return validTransitions[from]?.includes(to) ?? false;
  }
}

/**
 * User factory functions
 */
export class UserFactory {
  /**
   * Create a new user object (not persisted)
   */
  static create(input: CreateUserInput): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      displayName: input.displayName,
      role: input.role,
      authStatus: AuthStatus.Pending,
      isActive: true,
      authorizedDevices: [],
    };
  }

  /**
   * Create an authorized device entry
   */
  static createAuthorizedDevice(deviceId: string, deviceName: string): AuthorizedDevice {
    return {
      deviceId,
      deviceName,
      authorizedAt: new Date().toISOString(),
    };
  }
}
