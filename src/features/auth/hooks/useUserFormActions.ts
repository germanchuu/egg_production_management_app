import { useState, useCallback } from 'react';
import { UserRole } from '@/shared/types/entities';
import { UserServiceProvider } from '@/features/auth/services/UserServiceProvider';

export interface UserFormData {
  displayName: string;
  role: UserRole;
}

export interface UseUserFormActionsProps {
  onSuccess: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export const useUserFormActions = ({
  onSuccess,
  showToast,
}: UseUserFormActionsProps) => {
  const [formLoading, setFormLoading] = useState(false);

  const handleCreateUser = useCallback(
    async (data: UserFormData) => {
      setFormLoading(true);
      try {
        const service = await UserServiceProvider.getUserService();
        const result = await service.createUser({
          displayName: data.displayName,
          role: data.role,
          createdBy: 'temp-admin-id', // TODO: Get from auth context
        });

        if (!result.success) {
          showToast(result.error || 'No se pudo crear el usuario', 'error');
          return;
        }

        showToast(`Usuario ${data.displayName} creado correctamente`, 'success');
        onSuccess();
      } catch (error) {
        console.error('Error creating user:', error);
        showToast('Ocurrió un error al crear el usuario', 'error');
      } finally {
        setFormLoading(false);
      }
    },
    [onSuccess, showToast]
  );

  const handleEditUser = useCallback(
    async (userId: string, data: UserFormData) => {
      setFormLoading(true);
      try {
        const service = await UserServiceProvider.getUserService();
        const result = await service.updateUser({
          id: userId,
          displayName: data.displayName,
          role: data.role,
        });

        if (!result.success) {
          showToast(result.error || 'No se pudo actualizar el usuario', 'error');
          return;
        }

        showToast(
          `Usuario ${data.displayName} actualizado correctamente`,
          'success'
        );
        onSuccess();
      } catch (error) {
        console.error('Error updating user:', error);
        showToast('Ocurrió un error al actualizar el usuario', 'error');
      } finally {
        setFormLoading(false);
      }
    },
    [onSuccess, showToast]
  );

  return { formLoading, handleCreateUser, handleEditUser };
};
