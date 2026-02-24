import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { BrushCleaning } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { EventHistoryList, AnyEvent } from './EventHistoryList';
import { BiosecurityEvent } from '../models/BiosecurityEvent';

interface BiosecurityTabProps {
  biosecurityEvents: BiosecurityEvent[];
}

export const BiosecurityTab: React.FC<BiosecurityTabProps> = ({ biosecurityEvents }) => {
  const sorted: AnyEvent[] = [...biosecurityEvents].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {sorted.length === 0 ? (
        <View className="bg-white rounded-md border border-gray-200 px-xl py-2xl items-center">
          <View className="w-16 h-16 rounded-full bg-teal-50 items-center justify-center mb-md">
            <BrushCleaning size={32} color="#0D9488" />
          </View>
          <Text className="text-textTertiary text-center">No hay eventos de bioseguridad registrados</Text>
        </View>
      ) : (
        <EventHistoryList
          events={sorted}
          emptyMessage="No hay eventos de bioseguridad registrados"
          emptyIcon="biosecurity"
        />
      )}
    </ScrollView>
  );
};
