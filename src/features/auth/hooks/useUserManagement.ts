import { useState, useEffect, useCallback } from 'react';
import { User } from '@/shared/types/entities';
import { UserServiceProvider } from '@/features/auth/services/UserServiceProvider';

export interface UseUserManagementProps {
  showToast?: (message: string, type: 'error') => void;
}

export const useUserManagement = (props?: UseUserManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const service = await UserServiceProvider.getUserService();
      const allUsers = await service.listAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      if (props?.showToast) {
        props.showToast('No se pudieron cargar los usuarios', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [props]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return { users, loading, refreshing, loadUsers, handleRefresh };
};
