import React, { useState } from 'react';
import { View } from 'react-native';
import { useLotDetails } from '../../contexts/LotDetailsContext';
import { EventHistoryList } from '@/features/health-biosecurity/components/EventHistoryList';
import { VaccinationsTab } from '@/features/health-biosecurity/components/VaccinationsTab';
import { BiosecurityTab } from '@/features/health-biosecurity/components/BiosecurityTab';
import { SubTabBar } from '@/shared/components/SubTabBar';
import { ScrollView } from 'react-native';

type HealthSubTab = 'Todos' | 'Vacunaciones' | 'Bioseguridad';

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
  const [activeTab, setActiveTab] = useState<HealthSubTab>('Todos');

  const allEvents = [...healthEvents, ...biosecurityEvents].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );

  if (loading) return <Skeleton />;

  return (
    <View style={{ flex: 1 }}>
      <SubTabBar
        tabs={['Todos', 'Vacunaciones', 'Bioseguridad'] as HealthSubTab[]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'Todos' && (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <EventHistoryList
            events={allEvents}
            lots={[lot]}
            emptyMessage="No hay eventos de salud ni bioseguridad registrados"
            emptyIcon="health"
          />
        </ScrollView>
      )}
      {activeTab === 'Vacunaciones' && (
        <VaccinationsTab healthEvents={healthEvents} lot={lot} />
      )}
      {activeTab === 'Bioseguridad' && (
        <BiosecurityTab biosecurityEvents={biosecurityEvents} />
      )}
    </View>
  );
};
