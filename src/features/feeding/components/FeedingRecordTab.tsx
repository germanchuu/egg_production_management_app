import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import { Package } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { useFeedingScreen } from '../contexts/FeedingScreenContext';
import { FeedingForm } from './FeedingForm';
import { FeedingHistoryList } from './FeedingHistoryList';

// ─── Loading skeleton ────────────────────────────────────────────────────────

const RecordSkeleton: React.FC = () => (
  <View className="px-lg py-md gap-md">
    {[1, 2, 3].map((i) => (
      <View key={i} className="bg-white rounded-md border border-gray-100 p-md">
        <View className="h-4 bg-gray-200 rounded w-3/4 mb-sm" />
        <View className="h-4 bg-gray-200 rounded w-1/2" />
      </View>
    ))}
  </View>
);

// ─── Empty batch state ───────────────────────────────────────────────────────

const NoBatchesWarning: React.FC<{ onGoToBatches: () => void }> = ({ onGoToBatches }) => (
  <MotiView
    from={{ opacity: 0, translateY: 16 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 250 }}
    className="px-lg py-md"
  >
    <View className="bg-amber-50 border border-amber-200 rounded-md p-lg items-center">
      <Package size={32} color={theme.colors.warning.DEFAULT} />
      <Text className="text-base font-semibold text-amber-800 text-center mt-md">
        Sin lotes de alimento
      </Text>
      <Text className="text-sm text-amber-700 text-center mt-xs mb-md">
        Registra un lote de alimento antes de registrar alimentación
      </Text>
      <Pressable className="bg-primary-500 px-lg py-sm rounded-md" onPress={onGoToBatches}>
        <Text className="text-white font-medium text-sm">Ir a Lotes de Alimento</Text>
      </Pressable>
    </View>
  </MotiView>
);

// ─── FeedingRecordTab ────────────────────────────────────────────────────────

export const FeedingRecordTab: React.FC = () => {
  const { lots, feedBatches, recentRecords, loading, isSubmitting, onRecordFeeding } =
    useFeedingScreen();
  const navigation = useNavigation();

  const handleGoToBatches = () => navigation.navigate('Lotes' as never);

  if (loading) return <RecordSkeleton />;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
      {feedBatches.length === 0 ? (
        <NoBatchesWarning onGoToBatches={handleGoToBatches} />
      ) : (
        <View className="px-lg py-md">
          <FeedingForm
            lots={lots}
            feedBatches={feedBatches}
            onSubmit={onRecordFeeding}
            isSubmitting={isSubmitting}
          />
        </View>
      )}

      <View className="px-lg py-md">
        <Text className="text-lg font-bold text-textPrimary mb-md">Registros Recientes</Text>
        <FeedingHistoryList
          records={recentRecords}
          feedBatches={feedBatches}
          emptyMessage="No hay registros de alimentación"
        />
      </View>
    </ScrollView>
  );
};
