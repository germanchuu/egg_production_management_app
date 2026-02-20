import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLotDetails } from '../../contexts/LotDetailsContext';
import { EventHistoryList } from '@/features/health-biosecurity/components/EventHistoryList';

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

export const HealthTab: React.FC = () => {
  const { lot, healthEvents, biosecurityEvents, loading } = useLotDetails();

  const allEvents = [...healthEvents, ...biosecurityEvents].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );

  if (loading) return <Skeleton />;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {healthEvents.length > 0 && biosecurityEvents.length > 0 && (
        <Text className="text-base font-semibold text-textPrimary mb-md">
          Todos los eventos
        </Text>
      )}
      <EventHistoryList
        events={allEvents}
        lots={[lot]}
        emptyMessage="No hay eventos de salud ni bioseguridad registrados"
        emptyIcon="health"
      />
    </ScrollView>
  );
};
