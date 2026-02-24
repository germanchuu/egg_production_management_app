import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Syringe } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { EventHistoryList, AnyEvent } from './EventHistoryList';
import { HealthEvent } from '../models/HealthEvent';
import { ChickenLot } from '@/shared/types/entities';

interface VaccinationsTabProps {
  healthEvents: HealthEvent[];
  lot: ChickenLot;
}

export const VaccinationsTab: React.FC<VaccinationsTabProps> = ({ healthEvents, lot }) => {
  const sorted: AnyEvent[] = [...healthEvents].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {sorted.length === 0 ? (
        <View className="bg-white rounded-md border border-gray-200 px-xl py-2xl items-center">
          <View className="w-16 h-16 rounded-full bg-primary-50 items-center justify-center mb-md">
            <Syringe size={32} color={theme.colors.primary['400']} />
          </View>
          <Text className="text-textTertiary text-center">No hay vacunaciones registradas para este lote</Text>
        </View>
      ) : (
        <EventHistoryList
          events={sorted}
          lots={[lot]}
          emptyMessage="No hay vacunaciones registradas"
          emptyIcon="health"
        />
      )}
    </ScrollView>
  );
};
