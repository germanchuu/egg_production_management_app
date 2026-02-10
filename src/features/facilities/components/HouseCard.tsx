/**
 * HouseCard Component
 *
 * Displays chicken house summary information with edit/delete actions.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Edit3, CloudOff } from 'lucide-react-native';
import { ChickenHouse } from '@/shared/types/entities';
import { theme } from '@/core/theme';

interface HouseCardProps {
  house: ChickenHouse;
  hasPending?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const HouseCard: React.FC<HouseCardProps> = ({
  house,
  hasPending,
  onEdit,
  onDelete,
}) => {
  return (
    <View className="bg-white rounded-md p-lg border border-gray-200 shadow-sm">
      {/* Header Row */}
      <View className="flex-row justify-between items-start mb-sm">
        <Text className="text-lg font-bold text-textPrimary flex-1">
          {house.name}
        </Text>

        {/* Edit Button */}
        {onEdit && (
          <Pressable
            onPress={onEdit}
            className="p-sm rounded-md bg-gray-100 active:bg-gray-200"
          >
            <Edit3 size={18} color={theme.colors.gray['700']} />
          </Pressable>
        )}
      </View>

      {/* Description */}
      {house.description && (
        <Text className="text-sm text-textSecondary mb-md">
          {house.description}
        </Text>
      )}

      {/* Pending Sync Badge */}
      {hasPending && (
        <View className="flex-row items-center gap-xs bg-warning/10 border border-warning rounded-md px-sm py-xs mb-md">
          <CloudOff size={14} color={theme.colors.warning.DEFAULT} />
          <Text className="text-xs font-medium text-warning">
            Cambios pendientes por sincronizar
          </Text>
        </View>
      )}

      {/* Created Date */}
      <Text className="text-xs text-textTertiary">
        Creado:{' '}
        {new Date(house.createdAt).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </Text>

      {/* Delete Button */}
      {onDelete && (
        <Pressable
          onPress={onDelete}
          className="mt-md p-sm rounded-md bg-error/10 active:bg-error/20"
        >
          <Text className="text-sm font-medium text-error text-center">
            Eliminar Galpón
          </Text>
        </Pressable>
      )}
    </View>
  );
};
