/**
 * Invitation Model
 *
 * Token-based invitations shared via native share sheet (no email).
 * Deep links use Custom URL Scheme (myapp://invite/[token]).
 * One-time use only, expires after 7 days.
 *
 * Status transitions:
 * - pending → accepted (user accepts invitation before expiry)
 * - pending → expired (7 days pass without acceptance)
 */

import {
  Invitation as InvitationEntity,
  InvitationStatus,
} from '@/shared/types/entities';
import { getDeepLinkBase } from '@/core/config/constants';

/**
 * Re-export shared types for convenience
 */
export { InvitationStatus };

/**
 * Invitation model interface (extends shared entity)
 */
export type Invitation = InvitationEntity;

/**
 * Invitation creation input
 */
export interface CreateInvitationInput {
  userId: string;
  createdBy: string;
}

/**
 * Invitation validation helper functions
 */
export class InvitationValidator {
  /**
   * Validates if invitation is still valid (not expired, status pending)
   */
  static isValid(invitation: Invitation): boolean {
    if (invitation.status !== InvitationStatus.Pending) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    return now < expiresAt;
  }

  /**
   * Validates if invitation has expired
   */
  static isExpired(invitation: Invitation): boolean {
    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    return now >= expiresAt;
  }

  /**
   * Validates if invitation can be accepted
   */
  static canAccept(invitation: Invitation): boolean {
    return (
      invitation.status === InvitationStatus.Pending &&
      !InvitationValidator.isExpired(invitation)
    );
  }

  /**
   * Validates if invitation can be regenerated
   * Can regenerate if expired or if user still pending
   */
  static canRegenerate(invitation: Invitation): boolean {
    return (
      invitation.status === InvitationStatus.Pending ||
      invitation.status === InvitationStatus.Expired
    );
  }

  /**
   * Check if token format is valid (basic validation)
   */
  static isValidToken(token: string): boolean {
    // Token should be a non-empty string (UUID format validated server-side)
    return token.length > 0;
  }
}

/**
 * Invitation status helper functions
 */
export class InvitationStatusHelper {
  /**
   * Get human-readable status label in Spanish
   */
  static getStatusLabel(status: InvitationStatus): string {
    switch (status) {
      case InvitationStatus.Pending:
        return 'Pendiente';
      case InvitationStatus.Accepted:
        return 'Aceptada';
      case InvitationStatus.Expired:
        return 'Expirada';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Check if status transition is valid
   */
  static isValidTransition(
    from: InvitationStatus,
    to: InvitationStatus
  ): boolean {
    // Valid transitions:
    // pending -> accepted (user accepts)
    // pending -> expired (time expires)
    // accepted/expired are terminal states
    const validTransitions: Record<InvitationStatus, InvitationStatus[]> = {
      [InvitationStatus.Pending]: [
        InvitationStatus.Accepted,
        InvitationStatus.Expired,
      ],
      [InvitationStatus.Accepted]: [],
      [InvitationStatus.Expired]: [],
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Get remaining days until expiration
   */
  static getRemainingDays(invitation: Invitation): number {
    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    const diff = expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Get expiration status message
   */
  static getExpirationMessage(invitation: Invitation): string {
    const remainingDays = InvitationStatusHelper.getRemainingDays(invitation);

    if (remainingDays === 0) {
      return 'Expira hoy';
    } else if (remainingDays === 1) {
      return 'Expira mañana';
    } else if (remainingDays <= 7) {
      return `Expira en ${remainingDays} días`;
    }

    return 'Válida';
  }
}

/**
 * Invitation factory functions
 */
export class InvitationFactory {
  /**
   * Default invitation validity period (7 days)
   */
  static readonly VALIDITY_DAYS = 7;

  /**
   * Create a new invitation object (not persisted)
   * Token generation happens server-side
   */
  static create(
    input: CreateInvitationInput
  ): Omit<Invitation, 'id' | 'token' | 'createdAt' | 'updatedAt'> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + InvitationFactory.VALIDITY_DAYS);

    return {
      userId: input.userId,
      createdBy: input.createdBy,
      expiresAt: expiresAt.toISOString(),
      status: InvitationStatus.Pending,
    };
  }

  /**
   * Generate deep link URL from invitation token
   * Format: {scheme}://invite/[token] (production) or exp://...--/invite/[token] (Expo Go)
   */
  static generateDeepLink(token: string): string {
    return `${getDeepLinkBase()}/invite/${token}`;
  }

  /**
   * Extract token from deep link URL
   * Returns null if invalid format
   * Supports both production (scheme://invite/token) and Expo Go (exp://...--/invite/token) formats
   */
  static extractTokenFromDeepLink(url: string): string | null {
    // Match both formats:
    // - Production: myapp://invite/TOKEN
    // - Expo Go: exp://192.168.1.10:8081/--/invite/TOKEN
    const regex = /\/invite\/(.+)$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Generate shareable message for invitation
   */
  static generateShareMessage(
    invitation: Invitation,
    userName: string
  ): string {
    const deepLink = InvitationFactory.generateDeepLink(invitation.token);
    const expirationDays = InvitationStatusHelper.getRemainingDays(invitation);

    return `Has sido invitado a la aplicación de Gestión de Producción de Huevos.

Usuario: ${userName}

Toca el siguiente enlace para aceptar la invitación:
${deepLink}

Esta invitación expira en ${expirationDays} días.`;
  }
}
