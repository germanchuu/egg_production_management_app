/**
 * Feeding Entry Screen (T128)
 *
 * Main screen for recording daily feeding events.
 * Features:
 * - Feeding entry form at top
 * - Recent feeding history below
 * - Works fully offline with sync queue
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Wheat, Package } from 'lucide-react-native';
import { ChickenLot } from '@/shared/types/entities';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { FeedingServiceProvider } from '@/features/feeding/services/FeedingServiceProvider';
import {
  FeedBatchWithRemaining,
  FeedingRecordWithMetrics,
} from '@/features/feeding/services/FeedingService';
import { FeedingForm } from '@/features/feeding/components/FeedingForm';
import { FeedingHistoryList } from '@/features/feeding/components/FeedingHistoryList';
import { FeedingRecordFormData } from '@/features/feeding/utils/validation';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { useSyncRefresh } from '@/shared/contexts/SyncContext';
import { theme } from '@/core/theme';
import { Button } from '@/shared/components/Button';

export default function FeedingScreen() {
  const { user } = useAuth();
  const { success, error, warning } = useToastContext();
  const router = useRouter();

  const [lots, setLots] = useState<ChickenLot[]>([]);
  const [feedBatches, setFeedBatches] = useState<FeedBatchWithRemaining[]>([]);
  const [recentRecords, setRecentRecords] = useState<FeedingRecordWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const facilityService = await FacilityServiceProvider.getFacilityService();
      const feedingService = await FeedingServiceProvider.getFeedingService();

      // Active lots
      const lotsResult = await facilityService.listActiveLots();
      if (lotsResult.success && lotsResult.data) {
        setLots(lotsResult.data);
      }

      // Feed batches (with remaining qty)
      const batchesResult = await feedingService.listFeedBatches();
      if (batchesResult.success && batchesResult.data) {
        setFeedBatches(batchesResult.data);
      }

      // Recent feeding records (all lots, last 10)
      // We aggregate from all lots - simplest approach for now
      const allRecords: FeedingRecordWithMetrics[] = [];
      const lotsList = lotsResult.data ?? [];
      for (const lot of lotsList.slice(0, 5)) {
        const historyResult = await feedingService.getFeedingHistory(lot.id);
        if (historyResult.success && historyResult.data) {
          allRecords.push(...historyResult.data);
        }
      }

      // Sort by date desc, take 10
      const sorted = allRecords
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10);

      setRecentRecords(sorted);
    } catch {
      error('No se pudo cargar los datos de alimentación');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useSyncRefresh(loadData);

  const handleRecordFeeding = async (data: FeedingRecordFormData) => {
    if (!user) {
      error('Debes estar autenticado');
      return;
    }

    try {
      setIsSubmitting(true);
      const service = await FeedingServiceProvider.getFeedingService();
      const result = await service.recordFeeding({
        lotId: data.lotId,
        feedBatchId: data.feedBatchId,
        date: data.date,
        quantityFedKg: data.quantityFedKg,
        recordedBy: user.id,
      });

      if (result.success) {
        // Show warning if quantity exceeded remaining
        if (result.warning) {
          warning(result.warning);
        }
        success(
          `Alimentación registrada: ${data.quantityFedKg.toFixed(2)} kg`
        );
        await loadData();
      } else {
        error(result.error || 'Error al registrar la alimentación');
      }
    } catch {
      error('No se pudo registrar la alimentación');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
        <ScrollView className="flex-1">
          <View className="px-lg pt-xl pb-md border-b border-gray-200">
            <View className="flex-row items-center">
              <Wheat size={32} color={theme.colors.primary['500']} />
              <Text className="text-2xl font-bold text-textPrimary ml-md">
                Alimentación
              </Text>
            </View>
          </View>
          <View className="px-lg py-md gap-md">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="bg-white rounded-md border border-gray-100 p-md"
              >
                <View className="h-4 bg-gray-200 rounded w-3/4 mb-sm" />
                <View className="h-4 bg-gray-200 rounded w-1/2" />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const availableBatches = feedBatches.filter(
    (b) => b.remainingQuantityKg > 0
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* Header */}
        <View className="px-lg pt-xl pb-md border-b border-gray-200">
          <View className="flex-row items-center">
            <Wheat size={32} color={theme.colors.primary['500']} />
            <Text className="text-2xl font-bold text-textPrimary ml-md">
              Alimentación
            </Text>
          </View>
          <Text className="text-sm text-textSecondary mt-xs ml-12">
            {availableBatches.length}{' '}
            {availableBatches.length === 1
              ? 'lote disponible'
              : 'lotes disponibles'}
          </Text>
        </View>

        {/* No batches CTA */}
        {feedBatches.length === 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
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
              <Button
                variant="primary"
                icon={Package}
                onPress={() => router.push('/(tabs)/feeding/batches' as any)}
              >
                Ir a Lotes de Alimento
              </Button>
            </View>
          </MotiView>
        )}

        {/* Feeding Form */}
        {feedBatches.length > 0 && (
          <View className="px-lg py-md">
            <FeedingForm
              lots={lots}
              feedBatches={feedBatches}
              onSubmit={handleRecordFeeding}
              isSubmitting={isSubmitting}
            />
          </View>
        )}

        {/* Recent entries */}
        <View className="px-lg py-md">
          <View className="flex-row items-center justify-between mb-md">
            <Text className="text-lg font-bold text-textPrimary">
              Registros Recientes
            </Text>
          </View>
          <FeedingHistoryList
            records={recentRecords}
            feedBatches={feedBatches}
            emptyMessage="No hay registros de alimentación"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
