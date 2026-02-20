import React from 'react';
import { View, Text } from 'react-native';
import { ScrollView } from 'react-native';
import { useLotDetails } from '../../contexts/LotDetailsContext';
import { MortalityHistoryList } from '@/features/mortality/components/MortalityHistoryList';

const Skeleton: React.FC = () => (
  <View className="px-lg py-md gap-md">
    {[1, 2, 3].map((i) => (
      <View key={i} className="bg-white rounded-md border border-gray-100 p-md">
        <View className="h-4 bg-gray-200 rounded w-3/4 mb-sm" />
        <View className="h-4 bg-gray-200 rounded w-1/2" />
      </View>
    ))}
  </View>
);

export const MortalityTab: React.FC = () => {
  const { lot, mortalityHistory, loading } = useLotDetails();

  if (loading) return <Skeleton />;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-base font-semibold text-textPrimary mb-md">
        Historial de Mortalidad
      </Text>
      <MortalityHistoryList
        records={mortalityHistory}
        lots={[lot]}
        emptyMessage="No hay registros de mortalidad para este lote"
      />
    </ScrollView>
  );
};
