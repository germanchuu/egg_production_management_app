/**
 * Invitation Confirmation Component
 *
 * Displays invitation details card with accept button.
 * Shows "Esta es una invitación para: [user_name]" with accept button.
 *
 * Part of User Story 3: Invitation-Based Authentication
 * Note: Background image/gradient is handled by (auth)/_layout.tsx
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/shared/components';
import { InvitationStatusHelper } from '../models/Invitation';
import type { Invitation } from '@/shared/types/entities';

export interface InvitationConfirmationProps {
  /** The invitation data including status and expiration */
  invitation: Invitation;
  /** Display name of the user receiving the invitation */
  userName: string;
  /** Callback triggered when user accepts the invitation */
  onAccept: () => Promise<void>;
  /** Loading state during acceptance process */
  loading?: boolean;
  /** Optional error message to display */
  errorMessage?: string;
}

/**
 * InvitationConfirmation Component
 *
 * Invitation confirmation card component.
 * Background is handled by the (auth)/_layout.tsx wrapper.
 *
 * @example
 * ```tsx
 * <InvitationConfirmation
 *   invitation={invitationData}
 *   userName="Juan Pérez"
 *   onAccept={handleAcceptInvitation}
 *   loading={isAccepting}
 *   errorMessage={error}
 * />
 * ```
 */
export const InvitationConfirmation: React.FC<InvitationConfirmationProps> = ({
  invitation,
  userName,
  onAccept,
  loading = false,
  errorMessage,
}) => {
  const remainingDays = InvitationStatusHelper.getRemainingDays(invitation);
  const expirationMessage = InvitationStatusHelper.getExpirationMessage(invitation);
  const isExpired = invitation.status === 'expired' || remainingDays < 0;

  return (
    <View className="px-xl">
      {/* Main Card */}
      <View className="bg-white/95 rounded-2xl p-xl shadow-lg">
              {/* Icon or Logo Placeholder */}
              <View className="items-center mb-lg">
                <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center mb-md">
                  <Text className="text-4xl">📨</Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900 text-center">
                  Invitación Recibida
                </Text>
              </View>

              {/* Invitation Message */}
              <View className="mb-lg">
                <Text className="text-base text-gray-600 text-center mb-sm">
                  Esta es una invitación para:
                </Text>
                <Text className="text-xl font-bold text-primary-600 text-center">
                  {userName}
                </Text>
              </View>

              {/* Expiration Information */}
              <View className="mb-lg">
                <View className={`px-md py-sm rounded-md ${isExpired ? 'bg-error-light/10' : 'bg-primary-50'}`}>
                  <Text className={`text-sm text-center ${isExpired ? 'text-error-dark' : 'text-gray-700'}`}>
                    {expirationMessage}
                  </Text>
                </View>

                {!isExpired && remainingDays <= 2 && (
                  <View className="mt-sm px-md py-xs bg-warning/10 rounded-md">
                    <Text className="text-xs text-warning-dark text-center">
                      ⚠️ La invitación expira pronto
                    </Text>
                  </View>
                )}
              </View>

              {/* Error Message */}
              {errorMessage && (
                <View className="mb-md px-md py-sm bg-error-light/10 border border-error-light rounded-md">
                  <Text className="text-sm text-error-dark text-center">
                    {errorMessage}
                  </Text>
                </View>
              )}

              {/* Accept Button */}
              <Button
                variant="primary"
                onPress={onAccept}
                loading={loading}
                disabled={isExpired || loading}
                icon="checkmark-circle"
                iconPosition="left"
              >
                {isExpired ? 'Invitación Expirada' : 'Aceptar Invitación'}
              </Button>

              {/* Helper Text */}
              {!isExpired && (
                <Text className="text-xs text-gray-500 text-center mt-md">
                  Al aceptar, podrás acceder a la aplicación con las credenciales que
                  configurarás a continuación.
                </Text>
              )}
      </View>
    </View>
  );
};
