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
import { AlertTriangle, Clock, ShieldCheck } from 'lucide-react-native';
import { Button } from '@/shared/components';
import { InvitationStatusHelper } from '../models/Invitation';
import type { Invitation } from '@/shared/types/entities';
import { MotiText, MotiView } from 'moti';
import { theme } from '@/core/theme';

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
  const expirationMessage =
    InvitationStatusHelper.getExpirationMessage(invitation);
  const isExpired = invitation.status === 'expired' || remainingDays < 0;
  const showExpirationWarning = remainingDays <= 2 && !isExpired;

  const statusStyles = isExpired
    ? {
        container: 'bg-error/10 border-error/20',
        text: 'text-error',
        label: 'Invitación expirada',
      }
    : showExpirationWarning
      ? {
          container: 'bg-warning/10 border-warning/20',
          text: 'text-warning',
          label: expirationMessage,
        }
      : {
          container: 'bg-info/10 border-info/20',
          text: 'text-info',
          label: `Válida por ${remainingDays} días`,
        };

  return (
    <View className="justify-center px-md">
      {/* Header: icon + user */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 250 }}
        className="flex-row items-center gap-md mb-md"
      >
        <View className="w-16 h-16 rounded-full bg-info/10 items-center justify-center">
          <ShieldCheck size={32} color={theme.colors.info.DEFAULT} />
        </View>

        <View className="flex-1">
          <Text className="text-sm text-textSecondary">Invitación para</Text>
          <Text className="text-xl font-bold text-textPrimary">{userName}</Text>
        </View>
      </MotiView>

      {/* Expiration / status box */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 250, delay: 100 }}
        className={`p-md border rounded-md mb-md ${statusStyles.container}`}
      >
        <Text className="text-xs text-textTertiary mb-xs">
          Estado de la invitación
        </Text>

        <Text className={`text-sm font-medium ${statusStyles.text}`}>
          {statusStyles.label}
        </Text>
      </MotiView>

      {/* Error message */}
      {errorMessage && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 250, delay: 150 }}
          className="bg-destructive/10 border border-destructive/20 rounded-xl px-md py-sm mb-md"
        >
          <Text className="text-sm text-destructive text-center">
            {errorMessage}
          </Text>
        </MotiView>
      )}

      {/* Acción principal */}
      {!isExpired && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 250, delay: 200 }}
          className="mb-sm py-3 border-y border-primary/10"
        >
          <Button
            variant="primary"
            onPress={onAccept}
            loading={loading}
            disabled={loading}
            icon={ShieldCheck}
          >
            {loading ? 'Procesando...' : 'Aceptar invitación'}
          </Button>
        </MotiView>
      )}

      {/* Nota inferior */}
      <Text className="text-xs text-textTertiary text-center">
        {isExpired
          ? 'Esta invitación ha expirado. Solicita una nueva al administrador.'
          : 'Al aceptar, tendrás acceso completo al sistema de gestión.'}
      </Text>
    </View>
  );
};
