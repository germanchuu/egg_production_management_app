import { Invitation, InvitationStatus, UserRole } from '@/shared/types/entities';

/**
 * Builder pattern for creating Invitation test fixtures
 *
 * Usage:
 *   const invitation = new InvitationBuilder().asAdmin().build();
 */
export class InvitationBuilder {
  private invitation: Invitation = {
    id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: UserRole.User,
    token: `token-${Math.random().toString(36).substr(2, 16)}`,
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    status: InvitationStatus.Pending,
    updatedAt: new Date().toISOString(),
  };

  withId(id: string): this {
    this.invitation.id = id;
    return this;
  }

  withRole(role: UserRole): this {
    this.invitation.role = role;
    return this;
  }

  asAdmin(): this {
    return this.withRole(UserRole.Admin);
  }

  asUser(): this {
    return this.withRole(UserRole.User);
  }

  withToken(token: string): this {
    this.invitation.token = token;
    return this;
  }

  withCreatedBy(userId: string): this {
    this.invitation.createdBy = userId;
    return this;
  }

  withExpiresAt(expiresAt: string): this {
    this.invitation.expiresAt = expiresAt;
    return this;
  }

  expired(): this {
    this.invitation.expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Yesterday
    this.invitation.status = InvitationStatus.Expired;
    return this;
  }

  accepted(acceptedBy: string): this {
    this.invitation.status = InvitationStatus.Accepted;
    this.invitation.acceptedBy = acceptedBy;
    this.invitation.acceptedAt = new Date().toISOString();
    return this;
  }

  build(): Invitation {
    return { ...this.invitation };
  }
}
