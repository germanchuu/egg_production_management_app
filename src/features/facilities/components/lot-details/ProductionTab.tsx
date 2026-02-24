import React, { useState, useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useLotDetails } from '../../contexts/LotDetailsContext';
import { ProductionHistoryList } from '@/features/production/components/ProductionHistoryList';
import { ProductionTrendsTab } from '@/features/production/components/ProductionTrendsTab';
import { ProductionSummaryTab } from '@/features/production/components/ProductionSummaryTab';
import { DateRangeFilter, DateRange, getStartDate } from '@/shared/components/DateRangeFilter';
import { SubTabBar } from '@/shared/components/SubTabBar';

type ProductionSubTab = 'Historial' | 'Tendencias' | 'Resumen';

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
  const { lot, productionHistory, loading } = useLotDetails();
  const [dateRange, setDateRange] = useState<DateRange>('30D');
  const [activeTab, setActiveTab] = useState<ProductionSubTab>('Historial');

  const filteredRecords = useMemo(() => {
    const startDate = getStartDate(dateRange, lot.purchaseDate);
    if (!startDate) return productionHistory;
    return productionHistory.filter((r) => r.date >= startDate);
  }, [productionHistory, dateRange, lot.purchaseDate]);

  if (loading) return <Skeleton />;

  return (
    <View style={{ flex: 1 }}>
      <DateRangeFilter value={dateRange} onChange={setDateRange} />
      <SubTabBar
        tabs={['Historial', 'Tendencias', 'Resumen'] as ProductionSubTab[]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'Historial' && (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <ProductionHistoryList
            records={filteredRecords}
            lots={[lot]}
            emptyMessage="No hay registros de producción en este período"
          />
        </ScrollView>
      )}
      {activeTab === 'Tendencias' && (
        <ProductionTrendsTab records={filteredRecords} lot={lot} />
      )}
      {activeTab === 'Resumen' && (
        <ProductionSummaryTab records={filteredRecords} lot={lot} />
      )}
    </View>
  );
};
