/**
 * User Card Component
 *
 * Displays user information with actions
 */

import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { MotiView } from 'moti';
import {
  Mail,
  UserX,
  Shield,
  Edit,
  Calendar,
  Smartphone,
  Clock,
} from 'lucide-react-native';
import { Button } from '@/shared/components';
import { theme } from '@/core/theme';
import type { User } from '@/shared/types/entities';
import { AuthStatus, UserRole } from '@/shared/types/entities';
import { UserDisplayMapper } from '../mappers/UserDisplayMapper';

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
  const { statusColor, statusLabel, roleLabel, roleColor } =
    UserDisplayMapper.getUserDisplayInfo(user);

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
    user.authStatus === AuthStatus.Pending && user.role !== UserRole.Admin;

  const canRevoke =
    user.authStatus !== AuthStatus.Revoked && user.role !== UserRole.Admin;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: animationDelay }}
    >
      <View className="bg-white rounded-2xl shadow-card border border-gray-200 p-lg mb-md relative">
        {/* Edit */}
        {user.authStatus !== AuthStatus.Revoked && (
          <Pressable
            onPress={() => onEdit(user)}
            hitSlop={12}
            className="absolute bg-background-secondary top-md right-md p-2 rounded-md z-50"
            android_ripple={{ color: '#00000010', radius: 18 }}
          >
            <Edit size={20} color={theme.colors.textSecondary.DEFAULT} />
          </Pressable>
        )}

        {/* Avatar + Name */}
        <View className="flex-row items-center gap-md mb-sm">
          <View className="w-14 h-14 rounded-full bg-primary-100 items-center justify-center">
            <Text className="text-lg font-bold text-textPrimary">
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View className="flex-1">
            <Text className="text-lg font-semibold text-textPrimary">
              {user.displayName}
            </Text>

            {/* Role + Status */}
            <View className="flex-row items-center gap-sm mt-xs">
              {user.role === UserRole.Admin && (
                <View
                  className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${roleColor}20` }}
                >
                  <Shield size={12} color={roleColor} />
                  <Text
                    className="text-xs font-medium"
                    style={{ color: roleColor }}
                  >
                    {roleLabel}
                  </Text>
                </View>
              )}

              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${statusColor}20` }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: statusColor }}
                >
                  {statusLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Metadata */}
        <View className="flex-row flex-wrap gap-md mt-sm mb-md">
          <View className="flex-row items-center gap-1">
            <View className="bg-background-secondary rounded p-xs">
              <Calendar size={14} color={theme.colors.textTertiary.DEFAULT} />
            </View>
            <Text className="text-xs text-textTertiary">
              Creado: {new Date(user.createdAt).toLocaleDateString('es-ES')}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <View className="bg-background-secondary rounded p-xs">
              <Smartphone size={14} color={theme.colors.textTertiary.DEFAULT} />
            </View>
            <Text className="text-xs text-textTertiary">
              {user.authorizedDevices?.length || 0} / 3 dispositivos
            </Text>
          </View>

          {user.lastAccessAt && (
            <View className="flex-row items-center gap-1">
              <View className="bg-background-secondary rounded p-xs">
                <Clock size={14} color={theme.colors.textTertiary.DEFAULT} />
              </View>
              <Text className="text-xs text-textTertiary">
                Último acceso:{' '}
                {new Date(user.lastAccessAt).toLocaleDateString('es-ES')}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {(canGenerateInvitation || canRevoke) && (
          <View className="flex-row gap-md mt-md">
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
              <View className="self-start">
                <Button variant="danger" icon={UserX} onPress={handleRevoke}>
                  Revocar
                </Button>
              </View>
            )}
          </View>
        )}
      </View>
    </MotiView>
  );
};
