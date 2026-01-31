/**
 * Invitation Service
 *
 * Handles invitation generation, validation, and acceptance.
 * Works in conjunction with Firebase Functions for server-side operations.
 *
 * Key responsibilities:
 * - Generate deep links for invitations
 * - Validate invitation tokens
 * - Handle invitation acceptance flow
 * - Regenerate expired invitations
 */

import { Invitation, InvitationStatus } from '@/shared/types/entities';
import {
  InvitationValidator,
  InvitationFactory,
  InvitationStatusHelper,
} from '@/features/auth/models/Invitation';

/**
 * Invitation validation result
 */
export interface InvitationValidationResult {
  valid: boolean;
  invitation?: Invitation;
  error?: 'expired' | 'already_accepted' | 'not_found' | 'invalid_token';
  message?: string;
}

/**
 * Invitation acceptance result
 */
export interface InvitationAcceptanceResult {
  success: boolean;
  userId?: string;
  error?: string;
}

/**
 * Invitation generation result
 */
export interface InvitationGenerationResult {
  success: boolean;
  invitation?: Invitation;
  deepLink?: string;
  error?: string;
}

/**
 * Invitation Service
 */
export class InvitationService {
  /**
   * Generate deep link from invitation token
   *
   * @param token - Invitation token
   * @returns Deep link URL
   */
  static generateDeepLink(token: string): string {
    return InvitationFactory.generateDeepLink(token);
  }

  /**
   * Extract token from deep link URL
   *
   * @param url - Deep link URL
   * @returns Invitation token or null if invalid
   */
  static extractTokenFromDeepLink(url: string): string | null {
    return InvitationFactory.extractTokenFromDeepLink(url);
  }

  /**
   * Validate invitation token
   *
   * Checks if token is valid format and invitation exists in Firestore.
   * Validates invitation status and expiration.
   *
   * @param token - Invitation token to validate
   * @param getInvitationFromFirestore - Function to fetch invitation from Firestore
   * @returns Validation result with invitation data or error
   */
  static async validateInvitationToken(
    token: string,
    getInvitationFromFirestore: (token: string) => Promise<Invitation | null>
  ): Promise<InvitationValidationResult> {
    try {
      // Validate token format
      if (!InvitationValidator.isValidToken(token)) {
        return {
          valid: false,
          error: 'invalid_token',
          message: 'El token de invitación no es válido',
        };
      }

      // Fetch invitation from Firestore
      const invitation = await getInvitationFromFirestore(token);

      if (!invitation) {
        return {
          valid: false,
          error: 'not_found',
          message: 'Invitación no encontrada',
        };
      }

      // Check if already accepted
      if (invitation.status === InvitationStatus.Accepted) {
        return {
          valid: false,
          error: 'already_accepted',
          message: 'Esta invitación ya ha sido aceptada',
          invitation,
        };
      }

      // Check if expired
      if (InvitationValidator.isExpired(invitation)) {
        return {
          valid: false,
          error: 'expired',
          message: 'Esta invitación ha expirado',
          invitation,
        };
      }

      // Check if can be accepted
      if (!InvitationValidator.canAccept(invitation)) {
        return {
          valid: false,
          error: 'invalid_token',
          message: 'Esta invitación no puede ser aceptada',
          invitation,
        };
      }

      return {
        valid: true,
        invitation,
      };
    } catch (error) {
      console.error('Error validating invitation token:', error);
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Error al validar la invitación',
      };
    }
  }

  /**
   * Accept invitation
   *
   * Calls Firebase Function to mark invitation as accepted and
   * update user authentication status.
   *
   * @param token - Invitation token
   * @param deviceId - Current device ID
   * @param deviceName - Current device name
   * @param acceptInvitationOnServer - Function to call server-side acceptance
   * @returns Acceptance result with user ID
   */
  static async acceptInvitation(
    token: string,
    deviceId: string,
    deviceName: string,
    acceptInvitationOnServer: (
      token: string,
      deviceId: string,
      deviceName: string
    ) => Promise<{ success: boolean; userId?: string; error?: string }>
  ): Promise<InvitationAcceptanceResult> {
    try {
      // Call server-side acceptance
      const result = await acceptInvitationOnServer(token, deviceId, deviceName);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Error al aceptar la invitación',
        };
      }

      return {
        success: true,
        userId: result.userId,
      };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return {
        success: false,
        error: 'Error al aceptar la invitación. Por favor intenta de nuevo.',
      };
    }
  }

  /**
   * Regenerate invitation
   *
   * Creates a new invitation for the same user (invalidates previous one).
   * Can only regenerate if invitation is expired or still pending.
   *
   * @param userId - User ID for whom to regenerate invitation
   * @param regenerateInvitationOnServer - Function to call server-side regeneration
   * @returns Generation result with new invitation
   */
  static async regenerateInvitation(
    userId: string,
    regenerateInvitationOnServer: (
      userId: string
    ) => Promise<{ success: boolean; invitation?: Invitation; error?: string }>
  ): Promise<InvitationGenerationResult> {
    try {
      // Call server-side regeneration
      const result = await regenerateInvitationOnServer(userId);

      if (!result.success || !result.invitation) {
        return {
          success: false,
          error: result.error || 'Error al regenerar la invitación',
        };
      }

      // Generate deep link
      const deepLink = InvitationService.generateDeepLink(result.invitation.token);

      return {
        success: true,
        invitation: result.invitation,
        deepLink,
      };
    } catch (error) {
      console.error('Error regenerating invitation:', error);
      return {
        success: false,
        error: 'Error al regenerar la invitación. Por favor intenta de nuevo.',
      };
    }
  }

  /**
   * Generate shareable message for invitation
   *
   * @param invitation - Invitation object
   * @param userName - User's display name
   * @returns Formatted message with deep link
   */
  static generateShareMessage(invitation: Invitation, userName: string): string {
    return InvitationFactory.generateShareMessage(invitation, userName);
  }

  /**
   * Check if invitation can be regenerated
   *
   * @param invitation - Invitation to check
   * @returns True if can be regenerated
   */
  static canRegenerate(invitation: Invitation): boolean {
    return InvitationValidator.canRegenerate(invitation);
  }

  /**
   * Get remaining days until expiration
   *
   * @param invitation - Invitation to check
   * @returns Number of days remaining
   */
  static getRemainingDays(invitation: Invitation): number {
    return InvitationStatusHelper.getRemainingDays(invitation);
  }
}
