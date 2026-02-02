import { User, UserRole, AuthStatus } from '@/shared/types/entities';

export class UserMapper {
  static toDomain(dbRecord: any): User {
    return {
      id: dbRecord.id,
      displayName: dbRecord.display_name,
      role: dbRecord.role as UserRole,
      authStatus: dbRecord.auth_status as AuthStatus,
      authorizedDevices: JSON.parse(dbRecord.authorized_devices || '[]'),
      isActive: Boolean(dbRecord.is_active),
      invitationId: dbRecord.invitation_id || undefined,
      lastAccessAt: dbRecord.last_access_at || undefined,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  static toPersistence(user: User): any {
    return {
      id: user.id,
      display_name: user.displayName,
      role: user.role,
      auth_status: user.authStatus,
      authorized_devices: JSON.stringify(user.authorizedDevices),
      is_active: user.isActive ? 1 : 0,
      invitation_id: user.invitationId ?? null,
      last_access_at: user.lastAccessAt ?? null,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }
}
