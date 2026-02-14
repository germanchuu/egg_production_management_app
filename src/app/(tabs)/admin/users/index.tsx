/**
 * User Management Screen - List View
 *
 * Admin-only screen for viewing and managing users.
 * Formularios moved to separate screens for better UX.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MotiView } from 'moti';
import { Users, UserPlus, Filter } from 'lucide-react-native';
import { theme } from '@/core/theme';
import type { User } from '@/shared/types/entities';
import { AuthStatus, UserRole } from '@/shared/types/entities';
import {
  UserSearchBar,
  UserFilters,
  UserCard,
} from '@/features/auth/components';
import { Button } from '@/shared/components';
import {
  useUserManagement,
  useFilteredUsers,
  useInvitationActions,
} from '@/features/auth/hooks';
import { UserCardSkeleton } from '@/features/auth/components/user/UserCardSkeleton';
import { useToastContext } from '@/shared/contexts';
import { useSyncRefresh } from '@/shared/contexts/SyncContext';

export default function UsersListScreen() {
  const router = useRouter();
  const { success, error } = useToastContext();

  // Data loading
  const { users, loading, refreshing, loadUsers, handleRefresh } =
    useUserManagement({
      showToast: (message) => error(message),
    });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [authStatusFilter, setAuthStatusFilter] = useState<AuthStatus | 'all'>(
    'all'
  );
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'lastAccessAt'>(
    'createdAt'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filtering
  const filteredUsers = useFilteredUsers(
    users,
    searchQuery,
    authStatusFilter,
    roleFilter,
    sortBy,
    sortOrder
  );

  // Invitation actions
  const { handleGenerateInvitation, handleRevokeUser } = useInvitationActions({
    showToast: (message, type) => {
      if (type === 'success') success(message);
      else error(message);
    },
  });

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  // Navigate to create user
  const handleCreateUser = () => {
    router.push('/admin/users/create');
  };

  // Navigate to edit user
  const handleEditUser = (user: User) => {
    router.push(`/admin/users/${user.id}`);
  };

  // Reload users when screen is focused (after create/edit)
  useFocusEffect(
    React.useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  // Auto-refresh when sync completes (from any screen)
  useSyncRefresh(loadUsers);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary['500']}
          />
        }
      >
        {/* Header */}
        <View className="px-lg pt-xl pb-md border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Users size={32} color={theme.colors.primary['500']} />
              <Text className="text-2xl font-bold text-textPrimary ml-md">
                Gestión de Usuarios
              </Text>
            </View>
          </View>
          <Text className="text-sm text-textSecondary mt-xs">
            {filteredUsers.length} usuario
            {filteredUsers.length !== 1 ? 's' : ''}
            {searchQuery || authStatusFilter !== 'all' || roleFilter !== 'all'
              ? ` (filtrado${filteredUsers.length !== users.length ? ` de ${users.length}` : ''})`
              : ''}
          </Text>
        </View>

        {/* Content */}
        <View className="px-lg py-md overflow-visible">
          {/* Action Button: Create User */}
          <View className="mb-md">
            <Button
              variant="primary"
              icon={UserPlus}
              onPress={handleCreateUser}
            >
              Crear Usuario
            </Button>
          </View>

          {/* Search + Filters */}
          <View className="flex-row items-center gap-sm">
            <View className="flex-1">
              <UserSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar por nombre..."
              />
            </View>

            <Pressable
              onPress={() => setShowFilters(!showFilters)}
              hitSlop={8}
              className={`
                min-h-[48px] min-w-[48px]
                rounded-md
                items-center justify-center
                ${showFilters ? 'bg-primary-500' : 'bg-white border border-gray-300'}
              `}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Filter
                size={20}
                color={
                  showFilters
                    ? theme.colors['text-textInverse']
                    : theme.colors['text-textSecondary']
                }
              />
            </Pressable>
          </View>

          {/* Filters */}
          {showFilters && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ type: 'timing', duration: 250 }}
              className="mt-md"
            >
              <UserFilters
                authStatus={authStatusFilter}
                role={roleFilter}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onAuthStatusChange={setAuthStatusFilter}
                onRoleChange={setRoleFilter}
                onSortByChange={setSortBy}
                onSortOrderToggle={toggleSortOrder}
              />
            </MotiView>
          )}

          <View className="my-md border-b border-gray-200" />

          {/* Loading State */}
          {loading && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 200 }}
              className="items-center py-xl"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <UserCardSkeleton key={i} />
              ))}
            </MotiView>
          )}

          {/* Empty State */}
          {!loading && filteredUsers.length === 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 250 }}
              className="items-center py-xl"
            >
              <Users size={64} color={theme.colors.gray['400']} />
              <Text className="text-lg font-semibold text-textPrimary mt-lg text-center">
                No hay usuarios
              </Text>
              <Text className="text-sm text-textSecondary mt-sm text-center px-xl">
                {searchQuery ||
                authStatusFilter !== 'all' ||
                roleFilter !== 'all'
                  ? 'No se encontraron usuarios con los filtros aplicados.'
                  : 'Los usuarios aparecerán aquí cuando sean creados.'}
              </Text>
            </MotiView>
          )}

          {/* User List */}
          {!loading && filteredUsers.length > 0 && (
            <View>
              {filteredUsers.map((user, index) => (
                <UserCard
                  key={user.id}
                  user={user}
                  animationDelay={index * 50}
                  onGenerateInvitation={handleGenerateInvitation}
                  onRevokeUser={handleRevokeUser}
                  onEdit={handleEditUser}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
