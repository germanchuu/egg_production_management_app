import React, { useState, useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useLotDetails } from '../../contexts/LotDetailsContext';
import { MortalityHistoryList } from '@/features/mortality/components/MortalityHistoryList';
import { MortalityTrendsTab } from '@/features/mortality/components/MortalityTrendsTab';
import { DateRangeFilter, DateRange, getStartDate } from '@/shared/components/DateRangeFilter';
import { SubTabBar } from '@/shared/components/SubTabBar';

type MortalitySubTab = 'Historial' | 'Tendencias';

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
  const [dateRange, setDateRange] = useState<DateRange>('30D');
  const [activeTab, setActiveTab] = useState<MortalitySubTab>('Historial');

  const filteredRecords = useMemo(() => {
    const startDate = getStartDate(dateRange, lot.purchaseDate);
    if (!startDate) return mortalityHistory;
    return mortalityHistory.filter((r) => r.date >= startDate);
  }, [mortalityHistory, dateRange, lot.purchaseDate]);

  if (loading) return <Skeleton />;

  return (
    <View style={{ flex: 1 }}>
      <DateRangeFilter value={dateRange} onChange={setDateRange} />
      <SubTabBar
        tabs={['Historial', 'Tendencias'] as MortalitySubTab[]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'Historial' ? (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <MortalityHistoryList
            records={filteredRecords}
            lots={[lot]}
            emptyMessage="No hay registros de mortalidad en este período"
          />
        </ScrollView>
      ) : (
        <MortalityTrendsTab records={filteredRecords} lot={lot} />
      )}
    </View>
  );
};
