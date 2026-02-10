/**
 * LotCard Component
 *
 * Displays chicken lot summary information.
 * Shows lot name, house, live hens, and current age.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChickenLot } from '@/shared/types/entities';
import { ChickenLotCompute } from '../models/ChickenLot';

interface LotCardProps {
  lot: ChickenLot;
  houseName?: string;
  onPress?: () => void;
}

export const LotCard: React.FC<LotCardProps> = ({
  lot,
  houseName,
  onPress,
}) => {
  const currentAge = ChickenLotCompute.calculateCurrentAgeWeeks(lot);
  const mortalityRate = ChickenLotCompute.calculateMortalityRate(lot);
  const isHighMortality = mortalityRate > 10;

  const content = (
    <View className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-bold text-gray-900">{lot.name}</Text>
        <View
          className={`px-2 py-1 rounded ${lot.liveHenCount > 0 ? 'bg-green-100' : 'bg-gray-100'}`}
        >
          <Text
            className={`text-xs font-medium ${lot.liveHenCount > 0 ? 'text-green-800' : 'text-gray-600'}`}
          >
            {lot.liveHenCount > 0 ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>

      {/* House */}
      {houseName && (
        <Text className="text-sm text-gray-600 mb-3">
          📍 {houseName}
        </Text>
      )}

      {/* Stats Grid */}
      <View className="flex-row justify-between">
        {/* Live Hens */}
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Gallinas Vivas</Text>
          <Text className="text-2xl font-bold text-gray-900">
            {lot.liveHenCount}
          </Text>
          <Text className="text-xs text-gray-500">
            de {lot.initialHenCount} inicial
          </Text>
        </View>

        {/* Age */}
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Edad</Text>
          <Text className="text-2xl font-bold text-gray-900">
            {currentAge}
          </Text>
          <Text className="text-xs text-gray-500">semanas</Text>
        </View>

        {/* Mortality Rate */}
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Mortalidad</Text>
          <Text
            className={`text-2xl font-bold ${isHighMortality ? 'text-red-600' : 'text-gray-900'}`}
          >
            {mortalityRate.toFixed(1)}%
          </Text>
          {isHighMortality && (
            <Text className="text-xs text-red-600">⚠️ Alta</Text>
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
