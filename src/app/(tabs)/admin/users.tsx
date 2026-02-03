/**
 * User Management Screen
 *
 * Admin-only screen for managing users:
 * - View all users with authentication status
 * - Search users by name
 * - Filter by auth status and role
 * - Sort by name, creation date, or last access
 * - Generate invitation links for pending users
 * - Revoke user access (permanent action)
 *
 * Following FRONTEND.md standards:
 * - Clean white background with compact cards
 * - Lucide icons throughout
 * - Timing animations (250ms, staggered by 50ms)
 * - Horizontal layouts for efficient space use
 * - Compact text sizes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Users, UserPlus, AlertCircle, Filter } from 'lucide-react-native';
import { theme } from '@/core/theme';
import type { User } from '@/shared/types/entities';
import { AuthStatus, UserRole } from '@/shared/types/entities';
import {
  UserSearchBar,
  UserFilters,
  UserCard,
  UserForm,
} from '@/features/auth/components';
import { Button } from '@/shared/components';
import {
  useUserManagement,
  useFilteredUsers,
  useUserFormActions,
  useInvitationActions,
} from '@/features/auth/hooks';
import { UserCardSkeleton } from '@/features/auth/components/UserCardSkeleton';

export default function UsersScreen() {
  // Data loading (replaces lines 56-95)
  const { users, loading, refreshing, loadUsers, handleRefresh } =
    useUserManagement();

  // Filters (maintain state local)
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

  // Filtering (replaces lines 98-146)
  const filteredUsers = useFilteredUsers(
    users,
    searchQuery,
    authStatusFilter,
    roleFilter,
    sortBy,
    sortOrder
  );

  // Form state (maintain local)
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form actions (replaces lines 231-289)
  const { formLoading, handleCreateUser, handleEditUser } = useUserFormActions(
    () => {
      setShowCreateForm(false);
      setEditingUser(null);
      loadUsers();
    }
  );

  // Invitation actions (replaces lines 149-223)
  const { handleGenerateInvitation, handleRevokeUser } = useInvitationActions();

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  // Cancel form
  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingUser(null);
  };

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    if (editingUser) {
      await handleEditUser(editingUser.id, data);
    } else {
      await handleCreateUser(data);
    }
  };

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
        <View className="px-lg py-md">
          {/* Create User Button */}
          {!showCreateForm && !editingUser && (
            <View className="mb-md">
              <Button
                variant="primary"
                icon={UserPlus}
                onPress={() => setShowCreateForm(true)}
              >
                Crear Usuario
              </Button>
            </View>
          )}

          {/* User Form (Create or Edit) */}
          {(showCreateForm || editingUser) && (
            <View className="mb-md">
              <UserForm
                user={editingUser || undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleCancelForm}
                loading={formLoading}
              />
            </View>
          )}

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
                        ${showFilters ? 'bg-primary-500 text-white' : 'bg-white border border-gray-300'}
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
                    ? theme.colors.textInverse.DEFAULT
                    : theme.colors.textSecondary.DEFAULT
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

          <View className="my-md border-b border-b-gray-200" />

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
                  onEdit={setEditingUser}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
