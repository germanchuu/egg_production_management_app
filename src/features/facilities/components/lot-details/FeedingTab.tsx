import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Scale, Wheat } from 'lucide-react-native';
import { useLotDetails } from '../../contexts/LotDetailsContext';
import { FeedingHistoryList } from '@/features/feeding/components/FeedingHistoryList';
import { theme } from '@/core/theme';

const Skeleton: React.FC = () => (
  <View className="px-lg py-md gap-md">
    <View className="flex-row gap-md">
      <View className="flex-1 bg-white rounded-md border border-gray-100 p-md h-20" />
      <View className="flex-1 bg-white rounded-md border border-gray-100 p-md h-20" />
    </View>
    {[1, 2, 3].map((i) => (
      <View key={i} className="bg-white rounded-md border border-gray-100 p-md">
        <View className="h-4 bg-gray-200 rounded w-3/4 mb-sm" />
        <View className="h-4 bg-gray-200 rounded w-1/2" />
      </View>
    ))}
  </View>
);

export const FeedingTab: React.FC = () => {
  const { lot, feedingHistory, feedBatches, totalFeedConsumed, avgFeedPerHen, loading } =
    useLotDetails();

  if (loading) return <Skeleton />;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* Métricas de alimentación */}
      {totalFeedConsumed > 0 && (
        <View className="flex-row gap-md mb-lg">
          <View className="flex-1 bg-white rounded-md border border-gray-100 shadow-sm p-md">
            <View className="flex-row items-center gap-sm mb-xs">
              <View className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center">
                <Scale size={16} color={theme.colors.primary['600']} />
              </View>
              <Text className="text-xs text-textSecondary">Total consumido</Text>
            </View>
            <Text className="text-2xl font-bold text-textPrimary">
              {totalFeedConsumed.toFixed(2)}
            </Text>
            <Text className="text-xs text-textTertiary mt-xs">kg</Text>
          </View>

          <View className="flex-1 bg-white rounded-md border border-gray-100 shadow-sm p-md">
            <View className="flex-row items-center gap-sm mb-xs">
              <View className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center">
                <Wheat size={16} color={theme.colors.primary['600']} />
              </View>
              <Text className="text-xs text-textSecondary">Promedio/gallina</Text>
            </View>
            <Text className="text-2xl font-bold text-textPrimary">
              {avgFeedPerHen.toFixed(3)}
            </Text>
            <Text className="text-xs text-textTertiary mt-xs">kg/gallina</Text>
          </View>
        </View>
      )}

      <Text className="text-base font-semibold text-textPrimary mb-md">
        Historial de Alimentación
      </Text>
      <FeedingHistoryList
        records={feedingHistory}
        feedBatches={feedBatches}
        liveHenCount={lot.liveHenCount}
        emptyMessage="No hay registros de alimentación para este lote"
      />
    </ScrollView>
  );
};
