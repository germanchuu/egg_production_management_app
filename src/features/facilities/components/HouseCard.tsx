/**
 * HouseCard Component
 *
 * Displays chicken house summary information with edit/delete actions.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Edit3 } from 'lucide-react-native';
import { ChickenHouse } from '@/shared/types/entities';
import { theme } from '@/core/theme';

interface HouseCardProps {
  house: ChickenHouse;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const HouseCard: React.FC<HouseCardProps> = ({
  house,
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

      {/* Created Date */}
      <Text className="text-xs text-textTertiary">
        Creado:{' '}
        {new Date(house.createdAt).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </Text>
    </View>
  );
};
