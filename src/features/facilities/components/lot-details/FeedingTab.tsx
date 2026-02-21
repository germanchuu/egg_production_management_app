import React, { useState, useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useLotDetails } from '../../contexts/LotDetailsContext';
import { FeedingHistoryList } from '@/features/feeding/components/FeedingHistoryList';
import { FeedingTrendsTab } from '@/features/feeding/components/FeedingTrendsTab';
import { FeedBatchAnalyticsTab } from '@/features/feeding/components/FeedBatchAnalyticsTab';
import { DateRangeFilter, DateRange, getStartDate } from '@/shared/components/DateRangeFilter';
import { SubTabBar } from '@/shared/components/SubTabBar';

type FeedingSubTab = 'Historial' | 'Tendencias' | 'Lotes';

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
  const { lot, feedingHistory, feedBatches, loading } = useLotDetails();
  const [dateRange, setDateRange] = useState<DateRange>('30D');
  const [activeTab, setActiveTab] = useState<FeedingSubTab>('Historial');

  const filteredRecords = useMemo(() => {
    const startDate = getStartDate(dateRange, lot.purchaseDate);
    if (!startDate) return feedingHistory;
    return feedingHistory.filter((r) => r.date >= startDate);
  }, [feedingHistory, dateRange, lot.purchaseDate]);

  if (loading) return <Skeleton />;

  return (
    <View style={{ flex: 1 }}>
      <DateRangeFilter value={dateRange} onChange={setDateRange} />
      <SubTabBar
        tabs={['Historial', 'Tendencias', 'Lotes'] as FeedingSubTab[]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'Historial' && (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <FeedingHistoryList
            records={filteredRecords}
            feedBatches={feedBatches}
            liveHenCount={lot.liveHenCount}
            emptyMessage="No hay registros de alimentación en este período"
          />
        </ScrollView>
      )}
      {activeTab === 'Tendencias' && (
        <FeedingTrendsTab records={filteredRecords} lot={lot} allDates={[]} />
      )}
      {activeTab === 'Lotes' && (
        <FeedBatchAnalyticsTab feedingHistory={filteredRecords} feedBatches={feedBatches} />
      )}
    </View>
  );
};
