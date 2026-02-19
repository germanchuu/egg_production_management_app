import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { Package } from 'lucide-react-native';
import { ChickenLot } from '@/shared/types/entities';
import { FeedBatchWithRemaining, FeedingRecordWithMetrics } from '../services/FeedingService';
import { FeedingForm } from './FeedingForm';
import { FeedingHistoryList } from './FeedingHistoryList';
import { FeedingRecordFormData } from '../utils/validation';
import { theme } from '@/core/theme';

interface FeedingRecordTabProps {
  lots: ChickenLot[];
  feedBatches: FeedBatchWithRemaining[];
  recentRecords: FeedingRecordWithMetrics[];
  isSubmitting: boolean;
  onSubmit: (data: FeedingRecordFormData) => void;
  onGoToBatches: () => void;
}

export const FeedingRecordTab: React.FC<FeedingRecordTabProps> = ({
  lots,
  feedBatches,
  recentRecords,
  isSubmitting,
  onSubmit,
  onGoToBatches,
}) => (
  <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
    {feedBatches.length === 0 ? (
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
          <Pressable
            className="bg-primary-500 px-lg py-sm rounded-md"
            onPress={onGoToBatches}
          >
            <Text className="text-white font-medium text-sm">Ir a Lotes de Alimento</Text>
          </Pressable>
        </View>
      </MotiView>
    ) : (
      <View className="px-lg py-md">
        <FeedingForm
          lots={lots}
          feedBatches={feedBatches}
          onSubmit={onSubmit}
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
