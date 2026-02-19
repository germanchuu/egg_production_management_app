/**
 * Feeding Screen
 *
 * Unified screen for feed management with two tabs:
 * - "Registrar": record daily feeding events + recent history
 * - "Lotes": manage feed batches (create / view remaining)
 */

import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Wheat } from 'lucide-react-native';
import { ChickenLot } from '@/shared/types/entities';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { FeedingServiceProvider } from '@/features/feeding/services/FeedingServiceProvider';
import {
  FeedBatchWithRemaining,
  FeedingRecordWithMetrics,
} from '@/features/feeding/services/FeedingService';
import { FeedingTabBar, FeedingTab } from '@/features/feeding/components/FeedingTabBar';
import { FeedingRecordTab } from '@/features/feeding/components/FeedingRecordTab';
import { FeedingBatchesTab } from '@/features/feeding/components/FeedingBatchesTab';
import { FeedingRecordFormData, FeedBatchFormData } from '@/features/feeding/utils/validation';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { useSyncRefresh } from '@/shared/contexts/SyncContext';
import { theme } from '@/core/theme';

export default function FeedingScreen() {
  const { user } = useAuth();
  const { success, error, warning } = useToastContext();

  const [activeTab, setActiveTab] = useState<FeedingTab>('record');
  const [lots, setLots] = useState<ChickenLot[]>([]);
  const [feedBatches, setFeedBatches] = useState<FeedBatchWithRemaining[]>([]);
  const [recentRecords, setRecentRecords] = useState<FeedingRecordWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const facilityService = await FacilityServiceProvider.getFacilityService();
      const feedingService = await FeedingServiceProvider.getFeedingService();

      const [lotsResult, batchesResult] = await Promise.all([
        facilityService.listActiveLots(),
        feedingService.listFeedBatches(),
      ]);

      const lotsList = lotsResult.data ?? [];
      if (lotsResult.success) setLots(lotsList);
      if (batchesResult.success && batchesResult.data) setFeedBatches(batchesResult.data);

      // Aggregate recent records from first 5 lots
      const allRecords: FeedingRecordWithMetrics[] = [];
      for (const lot of lotsList.slice(0, 5)) {
        const result = await feedingService.getFeedingHistory(lot.id);
        if (result.success && result.data) allRecords.push(...result.data);
      }
      setRecentRecords(
        allRecords
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10)
      );
    } catch {
      error('No se pudo cargar los datos de alimentación');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  useSyncRefresh(loadData);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleRecordFeeding = async (data: FeedingRecordFormData) => {
    if (!user) { error('Debes estar autenticado'); return; }
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
        if (result.warning) warning(result.warning);
        success(`Alimentación registrada: ${data.quantityFedKg.toFixed(2)} kg`);
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

  const handleCreateBatch = async (data: FeedBatchFormData) => {
    if (!user) { error('Debes estar autenticado'); return; }
    try {
      setIsSubmitting(true);
      const service = await FeedingServiceProvider.getFeedingService();
      const result = await service.createFeedBatch({
        batchName: data.batchName,
        preparationDate: data.preparationDate,
        quantityKg: data.quantityKg,
        preparedBy: user.id,
      });
      if (result.success) {
        success(`Lote registrado: ${data.batchName} (${data.quantityKg.toFixed(2)} kg)`);
        await loadData();
      } else {
        error(result.error || 'Error al registrar el lote de alimento');
      }
    } catch {
      error('No se pudo registrar el lote de alimento');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const availableBatches = feedBatches.filter((b) => b.remainingQuantityKg > 0);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Header + tab bar */}
      <View className="px-lg pt-xl pb-md bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <Wheat size={28} color={theme.colors.primary['500']} />
          <Text className="text-2xl font-bold text-textPrimary ml-md">Alimentación</Text>
        </View>
        <FeedingTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          availableBatchCount={availableBatches.length}
        />
      </View>

      {/* Skeleton while loading */}
      {loading ? (
        <View className="px-lg py-md gap-md">
          {[1, 2, 3].map((i) => (
            <View key={i} className="bg-white rounded-md border border-gray-100 p-md">
              <View className="h-4 bg-gray-200 rounded w-3/4 mb-sm" />
              <View className="h-4 bg-gray-200 rounded w-1/2" />
            </View>
          ))}
        </View>
      ) : (
        <>
          {activeTab === 'record' && (
            <FeedingRecordTab
              lots={lots}
              feedBatches={feedBatches}
              recentRecords={recentRecords}
              isSubmitting={isSubmitting}
              onSubmit={handleRecordFeeding}
              onGoToBatches={() => setActiveTab('batches')}
            />
          )}
          {activeTab === 'batches' && (
            <FeedingBatchesTab
              batches={feedBatches}
              isSubmitting={isSubmitting}
              onCreateBatch={handleCreateBatch}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}
