import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { User } from '@/shared/types/entities';
import { UserServiceProvider } from '@/features/auth/services/UserServiceProvider';

export const useUserManagement = () => {
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
      Alert.alert('Error', 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return { users, loading, refreshing, loadUsers, handleRefresh };
};
