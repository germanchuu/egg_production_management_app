import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useHealthBiosecurity } from '../contexts/HealthBiosecurityContext';
import { HealthEventForm } from './HealthEventForm';
import { EventHistoryList } from './EventHistoryList';

// ─── Loading skeleton ────────────────────────────────────────────────────────

const HealthSkeleton: React.FC = () => (
  <View className="px-lg py-md gap-md">
    {[1, 2, 3].map((i) => (
      <View key={i} className="bg-white rounded-md border border-gray-100 p-md">
        <View className="h-4 bg-gray-200 rounded w-3/4 mb-sm" />
        <View className="h-4 bg-gray-200 rounded w-1/2" />
      </View>
    ))}
  </View>
);

// ─── HealthEventTab ───────────────────────────────────────────────────────────

export const HealthEventTab: React.FC = () => {
  const { lots, healthEvents, loading, isSubmitting, onRecordHealthEvent } =
    useHealthBiosecurity();

  if (loading) return <HealthSkeleton />;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="px-lg py-md">
        <HealthEventForm
          lots={lots}
          onSubmit={onRecordHealthEvent}
          isSubmitting={isSubmitting}
        />
      </View>

      <View className="px-lg py-md">
        <Text className="text-lg font-bold text-textPrimary mb-md">
          Historial de Vacunaciones
        </Text>
        <EventHistoryList
          events={healthEvents}
          lots={lots}
          emptyMessage="No hay vacunaciones registradas"
          emptyIcon="health"
        />
      </View>
    </ScrollView>
  );
};
