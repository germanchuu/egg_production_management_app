import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { UserRole } from '@/shared/types/entities';
import { UserServiceProvider } from '@/features/auth/services/UserServiceProvider';

export interface UserFormData {
  displayName: string;
  role: UserRole;
}

export const useUserFormActions = (onSuccess: () => void) => {
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
          Alert.alert('Error', result.error || 'No se pudo crear el usuario');
          return;
        }

        Alert.alert(
          'Éxito',
          `Usuario ${data.displayName} creado correctamente`
        );
        onSuccess();
      } catch (error) {
        console.error('Error creating user:', error);
        Alert.alert('Error', 'Ocurrió un error al crear el usuario');
      } finally {
        setFormLoading(false);
      }
    },
    [onSuccess]
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
          Alert.alert(
            'Error',
            result.error || 'No se pudo actualizar el usuario'
          );
          return;
        }

        Alert.alert(
          'Éxito',
          `Usuario ${data.displayName} actualizado correctamente`
        );
        onSuccess();
      } catch (error) {
        console.error('Error updating user:', error);
        Alert.alert('Error', 'Ocurrió un error al actualizar el usuario');
      } finally {
        setFormLoading(false);
      }
    },
    [onSuccess]
  );

  return { formLoading, handleCreateUser, handleEditUser };
};
