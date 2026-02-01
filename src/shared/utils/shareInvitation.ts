/**
 * Share Invitation Utility
 *
 * Handles native share sheet integration for invitation deep links
 * Works with WhatsApp, SMS, Email, and other sharing apps
 *
 * Uses InvitationFactory from models for message construction
 */

import { Share, Platform, Alert } from 'react-native';
import type { Invitation } from '@/features/auth/models/Invitation';
import { InvitationFactory } from '@/features/auth/models/Invitation';

export interface ShareInvitationResult {
  success: boolean;
  action?: 'sharedAction' | 'dismissedAction';
  error?: string;
}

/**
 * Shares an invitation using the native share sheet
 *
 * @param invitation - Invitation object with token
 * @param userName - Name of the user being invited
 * @returns Result indicating success or failure
 */
export async function shareInvitation(
  invitation: Invitation,
  userName: string
): Promise<ShareInvitationResult> {
  try {
    // Generate message using existing factory method
    const message = InvitationFactory.generateShareMessage(invitation, userName);
    const deepLink = InvitationFactory.generateDeepLink(invitation.token);

    return await shareMessage(message, deepLink, userName);
  } catch (error) {
    console.error('Error sharing invitation:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';

    return {
      success: false,
      error: `No se pudo compartir la invitación: ${errorMessage}`,
    };
  }
}

/**
 * Shares an invitation link directly (simplified version)
 * Use this when you only have the token and don't have the full invitation object
 *
 * @param token - Invitation token
 * @param userName - Name of the user being invited
 * @param expirationDays - Days until expiration (default: 7)
 * @returns Result indicating success or failure
 */
export async function shareInvitationByToken(
  token: string,
  userName: string,
  expirationDays: number = 7
): Promise<ShareInvitationResult> {
  try {
    const deepLink = InvitationFactory.generateDeepLink(token);

    // Simple message without full invitation object
    const message = `Has sido invitado a la aplicación de Gestión de Producción de Huevos.

Usuario: ${userName}

Toca el siguiente enlace para aceptar la invitación:
${deepLink}

Esta invitación expira en ${expirationDays} días.`;

    return await shareMessage(message, deepLink, userName);
  } catch (error) {
    console.error('Error sharing invitation by token:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';

    return {
      success: false,
      error: `No se pudo compartir la invitación: ${errorMessage}`,
    };
  }
}

/**
 * Internal helper to share message via native share sheet
 */
async function shareMessage(
  message: string,
  deepLink: string,
  userName: string
): Promise<ShareInvitationResult> {
  try {

    // Share options
    const shareOptions = {
      message,
      title: 'Invitación a Gestión de Huevos',
      // iOS specific: use URL for better app integration
      ...(Platform.OS === 'ios' && { url: deepLink }),
    };

    const shareDialogOptions = {
      // Android specific: dialog title
      ...(Platform.OS === 'android' && {
        dialogTitle: `Compartir invitación para ${userName}`,
      }),
      // iOS specific: subject for email
      ...(Platform.OS === 'ios' && {
        subject: 'Invitación a Gestión de Huevos',
      }),
    };

    const result = await Share.share(shareOptions, shareDialogOptions);

    // Handle result
    if (result.action === Share.sharedAction) {
      // User shared successfully
      if (Platform.OS === 'ios' && result.activityType) {
        console.log(`Shared via: ${result.activityType}`);
      }
      return {
        success: true,
        action: 'sharedAction',
      };
    } else if (result.action === Share.dismissedAction) {
      // User dismissed the share sheet
      return {
        success: false,
        action: 'dismissedAction',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in shareMessage:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';

    return {
      success: false,
      error: `Error al compartir: ${errorMessage}`,
    };
  }
}

/**
 * Shows a confirmation alert after successful share
 *
 * @param userName - Name of the user who was invited
 */
export function showShareSuccessAlert(userName: string): void {
  Alert.alert(
    'Invitación Compartida',
    `La invitación para ${userName} ha sido compartida exitosamente.`,
    [{ text: 'OK' }]
  );
}

/**
 * Shows an error alert if sharing fails
 *
 * @param error - Error message to display
 */
export function showShareErrorAlert(error?: string): void {
  Alert.alert(
    'Error al Compartir',
    error || 'No se pudo compartir la invitación. Por favor intenta de nuevo.',
    [{ text: 'OK' }]
  );
}
