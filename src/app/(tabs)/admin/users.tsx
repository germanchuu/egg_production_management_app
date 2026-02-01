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

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Users, UserPlus, AlertCircle } from 'lucide-react-native';
import { theme } from '@/core/theme';
import type { User } from '@/shared/types/entities';
import { AuthStatus, UserRole } from '@/shared/types/entities';
import { UserService } from '@/features/auth/services/UserService';
import {
  UserSearchBar,
  UserFilters,
  UserCard,
  UserForm,
  type UserFormData,
} from '@/features/auth/components';
import { Button } from '@/shared/components';
import { getDatabase } from '@/shared/database';

const FIREBASE_FUNCTION_BASE_URL =
  process.env.EXPO_PUBLIC_FIREBASE_FUNCTION_URL || '';

export default function UsersScreen() {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authStatusFilter, setAuthStatusFilter] = useState<AuthStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'lastAccessAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Load users
  const loadUsers = async () => {
    try {
      const db = await getDatabase();
      const allUsers = await UserService.listAllUsers(db);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los usuarios. Por favor intenta de nuevo.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((user) =>
        user.displayName.toLowerCase().includes(query)
      );
    }

    // Auth status filter
    if (authStatusFilter !== 'all') {
      filtered = filtered.filter((user) => user.authStatus === authStatusFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'createdAt':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'lastAccessAt':
          const aTime = a.lastAccessAt
            ? new Date(a.lastAccessAt).getTime()
            : 0;
          const bTime = b.lastAccessAt
            ? new Date(b.lastAccessAt).getTime()
            : 0;
          comparison = aTime - bTime;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [users, searchQuery, authStatusFilter, roleFilter, sortBy, sortOrder]);

  // Generate invitation
  const handleGenerateInvitation = async (user: User) => {
    try {
      const response = await fetch(
        `${FIREBASE_FUNCTION_BASE_URL}/generateInvitation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      const data = await response.json();

      if (!data.success || !data.invitationLink) {
        Alert.alert('Error', data.error || 'No se pudo generar la invitación');
        return;
      }

      // Share invitation link
      try {
        await Share.share({
          message: `¡Hola ${user.displayName}! Has sido invitado a unirte a Gestión de Huevos.\n\nAbre este enlace en tu dispositivo para aceptar la invitación:\n\n${data.invitationLink}`,
          title: 'Invitación a Gestión de Huevos',
        });
      } catch (shareError) {
        console.error('Error sharing:', shareError);
      }

      // Reload users to update status
      loadUsers();
    } catch (error) {
      console.error('Error generating invitation:', error);
      Alert.alert(
        'Error',
        'No se pudo generar la invitación. Verifica tu conexión.'
      );
    }
  };

  // Revoke user
  const handleRevokeUser = async (user: User) => {
    try {
      const response = await fetch(`${FIREBASE_FUNCTION_BASE_URL}/revokeUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!data.success) {
        Alert.alert('Error', data.error || 'No se pudo revocar el acceso');
        return;
      }

      Alert.alert('Éxito', `Acceso de ${user.displayName} revocado correctamente`);
      loadUsers();
    } catch (error) {
      console.error('Error revoking user:', error);
      Alert.alert(
        'Error',
        'No se pudo revocar el acceso. Verifica tu conexión.'
      );
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  // Create user
  const handleCreateUser = async (data: UserFormData) => {
    setFormLoading(true);
    try {
      const db = await getDatabase();

      // TODO: Get current admin user ID from auth context
      const currentAdminId = 'temp-admin-id'; // Placeholder

      const result = await UserService.createUser(db, {
        displayName: data.displayName,
        role: data.role,
        createdBy: currentAdminId,
      });

      if (!result.success) {
        Alert.alert('Error', result.error || 'No se pudo crear el usuario');
        return;
      }

      Alert.alert('Éxito', `Usuario ${data.displayName} creado correctamente`);
      setShowCreateForm(false);
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', 'Ocurrió un error al crear el usuario');
    } finally {
      setFormLoading(false);
    }
  };

  // Edit user
  const handleEditUser = async (data: UserFormData) => {
    if (!editingUser) return;

    setFormLoading(true);
    try {
      const db = await getDatabase();

      const result = await UserService.updateUser(db, {
        id: editingUser.id,
        displayName: data.displayName,
        role: data.role,
      });

      if (!result.success) {
        Alert.alert('Error', result.error || 'No se pudo actualizar el usuario');
        return;
      }

      Alert.alert('Éxito', `Usuario ${data.displayName} actualizado correctamente`);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el usuario');
    } finally {
      setFormLoading(false);
    }
  };

  // Cancel form
  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingUser(null);
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
              <Text className="text-2xl font-bold text-primary ml-md">
                Gestión de Usuarios
              </Text>
            </View>
          </View>
          <Text className="text-sm text-secondary mt-xs">
            {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
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
                onSubmit={editingUser ? handleEditUser : handleCreateUser}
                onCancel={handleCancelForm}
                loading={formLoading}
              />
            </View>
          )}

          {/* Search Bar */}
          <View className="mb-md">
            <UserSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar por nombre..."
            />
          </View>

          {/* Filters Toggle */}
          <View className="mb-md">
            <Button
              variant="secondary"
              icon={AlertCircle}
              onPress={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
          </View>

          {/* Filters */}
          {showFilters && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ type: 'timing', duration: 250 }}
              className="mb-md"
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

          {/* Loading State */}
          {loading && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 200 }}
              className="items-center py-xl"
            >
              <ActivityIndicator size="large" color={theme.colors.primary['500']} />
              <Text className="text-primary text-lg mt-lg font-semibold text-center">
                Cargando usuarios…
              </Text>
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
              <Text className="text-lg font-semibold text-primary mt-lg text-center">
                No hay usuarios
              </Text>
              <Text className="text-sm text-secondary mt-sm text-center px-xl">
                {searchQuery || authStatusFilter !== 'all' || roleFilter !== 'all'
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
