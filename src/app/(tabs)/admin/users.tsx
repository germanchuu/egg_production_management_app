/**
 * User Management Screen
 *
 * Admin-only screen for managing users and invitations.
 * Displays user list with authentication status and actions.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { User, AuthStatus } from '@/shared/types/entities';
import { Button } from '@/shared/components';

/**
 * Mock user data - Replace with actual data fetching
 */
const mockUsers: User[] = [];

export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [loading, setLoading] = useState(false);
  const [generatingInvitation, setGeneratingInvitation] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // TODO: Fetch users from database/Firebase
      // const fetchedUsers = await UserService.getAllUsers();
      // setUsers(fetchedUsers);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvitation = async () => {
    setGeneratingInvitation(true);
    try {
      // TODO: Call InvitationService to create invitation
      // const invitation = await InvitationService.createInvitation(...);
      // Share invitation deep link
      Alert.alert('Éxito', 'Invitación generada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar la invitación');
    } finally {
      setGeneratingInvitation(false);
    }
  };

  const handleRevokeUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Confirmar Revocación',
      `¿Está seguro de revocar el acceso de ${userName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Call Firebase Function to revoke user
              // await UserService.revokeUser(userId);
              loadUsers(); // Reload users after revocation
              Alert.alert('Éxito', 'Usuario revocado correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo revocar el usuario');
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (authStatus: AuthStatus) => {
    const statusConfig = {
      [AuthStatus.Pending]: {
        text: 'Pendiente',
        bgColor: 'bg-warning/20',
        textColor: 'text-warning-dark',
      },
      [AuthStatus.Authenticated]: {
        text: 'Autenticado',
        bgColor: 'bg-success/20',
        textColor: 'text-success-dark',
      },
      [AuthStatus.Revoked]: {
        text: 'Revocado',
        bgColor: 'bg-error/20',
        textColor: 'text-error-dark',
      },
    };

    const config = statusConfig[authStatus];

    return (
      <View className={`${config.bgColor} px-md py-xs rounded-sm`}>
        <Text className={`text-xs font-medium ${config.textColor}`}>
          {config.text}
        </Text>
      </View>
    );
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isRevoked = item.authStatus === AuthStatus.Revoked;

    return (
      <View className="bg-background border border-gray-200 rounded-md p-lg mb-md">
        <View className="flex-row justify-between items-start mb-md">
          <View className="flex-1">
            <Text className="text-base font-semibold text-text-primary mb-xs">
              {item.displayName}
            </Text>
            <Text className="text-sm text-text-secondary mb-sm">
              ID: {item.id}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-xs text-text-tertiary mr-sm">
                Rol: {item.role}
              </Text>
              {getStatusBadge(item.authStatus)}
            </View>
          </View>
        </View>

        {item.lastAccessAt && (
          <Text className="text-xs text-text-tertiary mb-md">
            Último acceso:{' '}
            {new Date(item.lastAccessAt).toLocaleDateString('es-ES')}
          </Text>
        )}

        <View className="flex-row gap-2">
          <TouchableOpacity
            disabled={isRevoked}
            onPress={() => handleRevokeUser(item.id, item.displayName)}
            className={`flex-1 py-sm px-md rounded-md border ${
              isRevoked
                ? 'bg-gray-100 border-gray-300'
                : 'bg-background border-error'
            }`}
          >
            <Text
              className={`text-sm font-medium text-center ${
                isRevoked ? 'text-text-tertiary' : 'text-error'
              }`}
            >
              {isRevoked ? 'Ya Revocado' : 'Revocar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background-secondary items-center justify-center">
        <ActivityIndicator size="large" color="#0097A7" />
        <Text className="mt-md text-text-secondary">Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-secondary">
      <View className="bg-primary px-xl py-4xl">
        <Text className="text-3xl font-bold text-text-inverse mb-sm">
          Gestión de Usuarios
        </Text>
        <Text className="text-base text-text-inverse/90">
          Administre usuarios e invitaciones
        </Text>
      </View>

      <View className="px-xl py-lg">
        <Button
          onPress={handleGenerateInvitation}
          disabled={generatingInvitation}
          className="bg-primary rounded-md py-md mb-xl"
        >
          {generatingInvitation ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text className="text-base font-semibold text-text-inverse ml-sm">
                Generando...
              </Text>
            </View>
          ) : (
            <Text className="text-base font-semibold text-text-inverse text-center">
              Generar Nueva Invitación
            </Text>
          )}
        </Button>

        {users.length === 0 ? (
          <View className="items-center py-5xl">
            <Text className="text-base text-text-secondary text-center">
              No hay usuarios registrados
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}
