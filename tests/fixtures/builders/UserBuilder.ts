import { User, UserRole } from '@/shared/types/entities';

/**
 * Builder pattern for creating User test fixtures
 *
 * Usage:
 *   const user = new UserBuilder().withRole(UserRole.Admin).build();
 */
export class UserBuilder {
  private user: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    displayName: 'Test User',
    role: UserRole.User,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  withId(id: string): this {
    this.user.id = id;
    return this;
  }

  withDisplayName(displayName: string): this {
    this.user.displayName = displayName;
    return this;
  }

  withPhoneNumber(phoneNumber: string): this {
    this.user.phoneNumber = phoneNumber;
    return this;
  }

  withIdNumber(idNumber: string): this {
    this.user.idNumber = idNumber;
    return this;
  }

  withRole(role: UserRole): this {
    this.user.role = role;
    return this;
  }

  asAdmin(): this {
    return this.withRole(UserRole.Admin);
  }

  asUser(): this {
    return this.withRole(UserRole.User);
  }

  withInvitationId(invitationId: string): this {
    this.user.invitationId = invitationId;
    return this;
  }

  inactive(): this {
    this.user.isActive = false;
    return this;
  }

  withLastLoginAt(lastLoginAt: string): this {
    this.user.lastLoginAt = lastLoginAt;
    return this;
  }

  build(): User {
    return { ...this.user };
  }
}
