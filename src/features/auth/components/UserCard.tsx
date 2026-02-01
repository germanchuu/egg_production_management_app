/**
 * User Card Component
 *
 * Displays user information with actions
 */

import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { MotiView } from 'moti';
import { Mail, UserX, Shield, Edit } from 'lucide-react-native';
import { theme } from '@/core/theme';
import type { User } from '@/shared/types/entities';
import { AuthStatus, UserRole } from '@/shared/types/entities';
import { UserService } from '../services/UserService';
import { Button } from '@/shared/components';

interface UserCardProps {
  user: User;
  animationDelay: number;
  onGenerateInvitation: (user: User) => void;
  onRevokeUser: (user: User) => void;
  onEdit: (user: User) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  animationDelay,
  onGenerateInvitation,
  onRevokeUser,
  onEdit,
}) => {
  const statusColor = UserService.getStatusColor(user.authStatus);
  const statusLabel = UserService.getStatusLabel(user.authStatus);
  const roleLabel = UserService.getRoleLabel(user.role);

  const handleRevoke = () => {
    Alert.alert(
      'Revocar Acceso',
      `¿Estás seguro de que deseas revocar el acceso de ${user.displayName}? Esta acción es permanente y no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: () => onRevokeUser(user),
        },
      ]
    );
  };

  const canGenerateInvitation =
    user.authStatus === AuthStatus.Pending &&
    user.role !== UserRole.Admin;

  const canRevoke =
    user.authStatus !== AuthStatus.Revoked &&
    user.role !== UserRole.Admin;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 250, delay: animationDelay }}
    >
      <View className="bg-white rounded-md shadow-sm border border-gray-100 p-md mb-md">
        {/* User Info */}
        <View className="flex-row items-center gap-md mb-md">
          {/* Avatar */}
          <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
            <Text className="text-lg font-semibold text-primary-700">
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Name and Role */}
          <View className="flex-1">
            <View className="flex-row items-center gap-xs mb-xs">
              <Text className="text-base font-semibold text-primary">
                {user.displayName}
              </Text>
              {user.role === UserRole.Admin && (
                <View className="bg-secondary-100 px-sm py-xs rounded-full">
                  <View className="flex-row items-center gap-xs">
                    <Shield size={12} color={theme.colors.secondary['700']} />
                    <Text className="text-xs font-medium text-secondary-700">
                      Admin
                    </Text>
                  </View>
                </View>
              )}
            </View>
            <Text className="text-sm text-secondary">{roleLabel}</Text>
          </View>

          {/* Status Badge */}
          <View
            className="px-md py-xs rounded-full"
            style={{ backgroundColor: `${statusColor}20` }}
          >
            <Text className="text-xs font-medium" style={{ color: statusColor }}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Metadata */}
        <View className="border-t border-gray-200 pt-md mb-md">
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-xs text-tertiary mb-xs">Creado</Text>
              <Text className="text-sm text-primary">
                {new Date(user.createdAt).toLocaleDateString('es-ES')}
              </Text>
            </View>
            {user.lastAccessAt && (
              <View className="flex-1">
                <Text className="text-xs text-tertiary mb-xs">Último Acceso</Text>
                <Text className="text-sm text-primary">
                  {new Date(user.lastAccessAt).toLocaleDateString('es-ES')}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-xs text-tertiary mb-xs">Dispositivos</Text>
              <Text className="text-sm text-primary">
                {user.authorizedDevices?.length || 0} / 3
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row gap-md">
          {/* Edit Button - Always available except for revoked users */}
          {user.authStatus !== AuthStatus.Revoked && (
            <View className="flex-1">
              <Button
                variant="secondary"
                icon={Edit}
                onPress={() => onEdit(user)}
              >
                Editar
              </Button>
            </View>
          )}

          {canGenerateInvitation && (
            <View className="flex-1">
              <Button
                variant="primary"
                icon={Mail}
                onPress={() => onGenerateInvitation(user)}
              >
                Generar Invitación
              </Button>
            </View>
          )}

          {canRevoke && (
            <View className="flex-1">
              <Button
                variant="danger"
                icon={UserX}
                onPress={handleRevoke}
              >
                Revocar
              </Button>
            </View>
          )}
        </View>
      </View>
    </MotiView>
  );
};
