import { User, UserRole, AuthStatus } from '@/shared/types/entities';

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
    authStatus: AuthStatus.Pending,
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

  withAuthStatus(authStatus: AuthStatus): this {
    this.user.authStatus = authStatus;
    return this;
  }

  authenticated(): this {
    return this.withAuthStatus(AuthStatus.Authenticated);
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

  withLastAccessAt(lastAccessAt: string): this {
    this.user.lastAccessAt = lastAccessAt;
    return this;
  }

  build(): User {
    return { ...this.user };
  }
}
