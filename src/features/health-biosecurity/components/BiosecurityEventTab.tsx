import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useHealthBiosecurity } from '../contexts/HealthBiosecurityContext';
import { BiosecurityEventForm } from './BiosecurityEventForm';
import { EventHistoryList } from './EventHistoryList';

// ─── Loading skeleton ────────────────────────────────────────────────────────

const BiosecuritySkeleton: React.FC = () => (
  <View className="px-lg py-md gap-md">
    {[1, 2, 3].map((i) => (
      <View key={i} className="bg-white rounded-md border border-gray-100 p-md">
        <View className="h-4 bg-gray-200 rounded w-3/4 mb-sm" />
        <View className="h-4 bg-gray-200 rounded w-1/2" />
      </View>
    ))}
  </View>
);

// ─── BiosecurityEventTab ──────────────────────────────────────────────────────

export const BiosecurityEventTab: React.FC = () => {
  const { biosecurityEvents, loading, isSubmitting, onRecordBiosecurityEvent } =
    useHealthBiosecurity();

  if (loading) return <BiosecuritySkeleton />;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="px-lg py-md">
        <BiosecurityEventForm
          onSubmit={onRecordBiosecurityEvent}
          isSubmitting={isSubmitting}
        />
      </View>

      <View className="px-lg py-md">
        <Text className="text-lg font-bold text-textPrimary mb-md">
          Historial de Desinfecciones
        </Text>
        <EventHistoryList
          events={biosecurityEvents}
          emptyMessage="No hay desinfecciones registradas"
          emptyIcon="biosecurity"
        />
      </View>
    </ScrollView>
  );
};
