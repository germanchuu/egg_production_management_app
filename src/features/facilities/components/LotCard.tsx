/**
 * LotCard Component
 *
 * Displays chicken lot summary information.
 * Shows lot name, house, live hens, and current age.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MapPin, AlertTriangle, Edit3 } from 'lucide-react-native';
import { ChickenLot } from '@/shared/types/entities';
import { ChickenLotCompute } from '../models/ChickenLot';
import { theme } from '@/core/theme';

interface LotCardProps {
  lot: ChickenLot;
  houseName?: string;
  onPress?: () => void;
  onEdit?: () => void;
}

export const LotCard: React.FC<LotCardProps> = ({
  lot,
  houseName,
  onPress,
  onEdit,
}) => {
  const currentAge = ChickenLotCompute.calculateCurrentAgeWeeks(lot);
  const mortalityRate = ChickenLotCompute.calculateMortalityRate(lot);
  const isHighMortality = mortalityRate > 10;

  const content = (
    <View className="bg-white rounded-md p-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-sm">
        <Text className="text-lg font-bold text-textPrimary flex-1">
          {lot.name}
        </Text>
        <View className="flex-row items-center gap-xs">
          {/* Edit Button */}
          {onEdit && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-sm rounded-md bg-gray-100 active:bg-gray-200"
            >
              <Edit3 size={18} color={theme.colors.gray['700']} />
            </Pressable>
          )}
          {/* Status Badge */}
          <View
            className={`px-sm py-xs rounded-sm ${lot.liveHenCount > 0 ? 'bg-success/10' : 'bg-gray-100'}`}
          >
            <Text
              className={`text-xs font-medium ${lot.liveHenCount > 0 ? 'text-success' : 'text-textSecondary'}`}
            >
              {lot.liveHenCount > 0 ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>
      </View>

      {/* House */}
      {houseName && (
        <View className="flex-row items-center gap-xs mb-md">
          <MapPin size={16} color={theme.colors.gray['500']} />
          <Text className="text-sm text-textSecondary">{houseName}</Text>
        </View>
      )}

      {/* Stats Grid */}
      <View className="flex-row justify-between">
        {/* Live Hens */}
        <View className="flex-1">
          <Text className="text-xs text-textTertiary mb-xs">Gallinas Vivas</Text>
          <Text className="text-2xl font-bold text-textPrimary">
            {lot.liveHenCount}
          </Text>
          <Text className="text-xs text-textTertiary">
            de {lot.initialHenCount} inicial
          </Text>
        </View>

        {/* Age */}
        <View className="flex-1">
          <Text className="text-xs text-textTertiary mb-xs">Edad</Text>
          <Text className="text-2xl font-bold text-textPrimary">
            {currentAge}
          </Text>
          <Text className="text-xs text-textTertiary">semanas</Text>
        </View>

        {/* Mortality Rate */}
        <View className="flex-1">
          <Text className="text-xs text-textTertiary mb-xs">Mortalidad</Text>
          <Text
            className={`text-2xl font-bold ${isHighMortality ? 'text-error' : 'text-textPrimary'}`}
          >
            {mortalityRate.toFixed(1)}%
          </Text>
          {isHighMortality && (
            <View className="flex-row items-center gap-xs">
              <AlertTriangle size={12} color={theme.colors.error.DEFAULT} />
              <Text className="text-xs text-error">Alta</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className="active:opacity-70"
      >
        {content}
      </Pressable>
    );
  }

  return content;
};
