import { useCallback } from 'react';
import { User } from '@/shared/types/entities';
import { InvitationApiService } from '@/features/auth/services/InvitationApiService';
import {
  shareInvitationByToken,
  showShareSuccessAlert,
  showShareErrorAlert,
} from '@/shared/utils/shareInvitation';
import { useAuth } from '@/features/auth/contexts';
import { AuthService } from '@/features/auth/services/AuthService';

export interface UseInvitationActionsProps {
  showToast: (message: string, type: 'success' | 'error') => void;
}

export const useInvitationActions = ({ showToast }: UseInvitationActionsProps) => {
  const { user: adminUser } = useAuth();
  const invitationService = new InvitationApiService(
    process.env.EXPO_PUBLIC_FIREBASE_FUNCTION_URL || ''
  );

  const handleGenerateInvitation = useCallback(
    async (user: User) => {
      try {
        // Get admin's device ID from session
        const session = await AuthService.getStoredSession();
        if (!session || !adminUser) {
          showToast('No se pudo obtener la sesión del administrador', 'error');
          return;
        }

        // TODO: Remove hardcoded values - DEV ONLY
        const adminId = 'admin-test-001';
        const deviceId = 'device-admin-123';

        // DEV OVERRIDE with env vars (alternative approach - commented):
        // const DEV_MODE = __DEV__;
        // const adminId = DEV_MODE
        //   ? process.env.EXPO_PUBLIC_DEV_ADMIN_ID || adminUser.id
        //   : adminUser.id;
        // const deviceId = DEV_MODE
        //   ? process.env.EXPO_PUBLIC_DEV_ADMIN_DEVICE_ID || session.deviceId
        //   : session.deviceId;

        // ORIGINAL IMPLEMENTATION (restore this later):
        // const result = await invitationService.generateInvitation(
        //   user.id,
        //   adminUser.id,
        //   session.deviceId
        // );

        const result = await invitationService.generateInvitation(
          user.id,
          adminId,
          deviceId
        );

        if (!result.success || !result.token) {
          showToast(result.error || 'No se pudo generar la invitación', 'error');
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
        showToast(
          'No se pudo generar la invitación. Verifica tu conexión.',
          'error'
        );
      }
    },
    [invitationService, showToast, adminUser]
  );

  const handleRevokeUser = useCallback(
    async (user: User) => {
      try {
        const result = await invitationService.revokeUser(user.id);

        if (!result.success) {
          showToast(result.error || 'No se pudo revocar el acceso', 'error');
          return;
        }

        showToast(
          `Acceso de ${user.displayName} revocado correctamente`,
          'success'
        );
      } catch (error) {
        console.error('Error revoking user:', error);
        showToast(
          'No se pudo revocar el acceso. Verifica tu conexión.',
          'error'
        );
      }
    },
    [invitationService, showToast]
  );

  return { handleGenerateInvitation, handleRevokeUser };
};
