import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLotDetails } from '../../contexts/LotDetailsContext';
import { ProductionMetricsCard } from '@/features/production/components/ProductionMetricsCard';
import { ProductionHistoryList } from '@/features/production/components/ProductionHistoryList';

const Skeleton: React.FC = () => (
  <View className="px-lg py-md gap-md">
    <View className="bg-white rounded-md border border-gray-100 p-md h-24" />
    {[1, 2, 3].map((i) => (
      <View key={i} className="bg-white rounded-md border border-gray-100 p-md">
        <View className="h-4 bg-gray-200 rounded w-3/4 mb-sm" />
        <View className="h-4 bg-gray-200 rounded w-1/2" />
      </View>
    ))}
  </View>
);

export const ProductionTab: React.FC = () => {
  const { lot, productionHistory, productionMetrics, loading } = useLotDetails();

  if (loading) return <Skeleton />;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {productionMetrics && (
        <View className="mb-lg">
          <ProductionMetricsCard metrics={productionMetrics} lotName={lot.name} />
        </View>
      )}

      <Text className="text-base font-semibold text-textPrimary mb-md">
        Historial de Producción
      </Text>
      <ProductionHistoryList
        records={productionHistory}
        lots={[lot]}
        emptyMessage="No hay registros de producción para este lote"
      />
    </ScrollView>
  );
};
