import { useCallback } from 'react';
import { Alert } from 'react-native';
import { User } from '@/shared/types/entities';
import { InvitationApiService } from '@/features/auth/services/InvitationApiService';
import {
  shareInvitationByToken,
  showShareSuccessAlert,
  showShareErrorAlert,
} from '@/shared/utils/shareInvitation';

export const useInvitationActions = () => {
  const invitationService = new InvitationApiService(
    process.env.EXPO_PUBLIC_FIREBASE_FUNCTION_URL || ''
  );

  const handleGenerateInvitation = useCallback(
    async (user: User) => {
      try {
        const result = await invitationService.generateInvitation(user.id);

        if (!result.success || !result.token) {
          Alert.alert(
            'Error',
            result.error || 'No se pudo generar la invitación'
          );
          return;
        }

        const expiresAt = new Date(result.expiresAt!);
        const diffTime = expiresAt.getTime() - new Date().getTime();
        const expirationDays = Math.max(
          0,
          Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        );

        const shareResult = await shareInvitationByToken(
          result.token,
          user.displayName,
          expirationDays
        );

        if (shareResult.success && shareResult.action === 'sharedAction') {
          showShareSuccessAlert(user.displayName);
        } else if (shareResult.error) {
          showShareErrorAlert(shareResult.error);
        }
      } catch (error) {
        console.error('Error generating invitation:', error);
        Alert.alert(
          'Error',
          'No se pudo generar la invitación. Verifica tu conexión.'
        );
      }
    },
    [invitationService]
  );

  const handleRevokeUser = useCallback(
    async (user: User) => {
      try {
        const result = await invitationService.revokeUser(user.id);

        if (!result.success) {
          Alert.alert('Error', result.error || 'No se pudo revocar el acceso');
          return;
        }

        Alert.alert(
          'Éxito',
          `Acceso de ${user.displayName} revocado correctamente`
        );
      } catch (error) {
        console.error('Error revoking user:', error);
        Alert.alert(
          'Error',
          'No se pudo revocar el acceso. Verifica tu conexión.'
        );
      }
    },
    [invitationService]
  );

  return { handleGenerateInvitation, handleRevokeUser };
};
