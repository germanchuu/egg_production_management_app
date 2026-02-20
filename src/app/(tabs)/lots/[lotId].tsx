/**
 * Lot Details Screen
 *
 * Header fijo con datos generales del lote (gallinas vivas, edad, mortalidad).
 * Debajo, un Material Top Tab Navigator con 4 secciones:
 *   - Mortalidad: historial de bajas
 *   - Producción: métricas + historial
 *   - Alimentación: métricas + historial
 *   - Salud & Bio: vacunaciones y desinfecciones
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, Bird } from 'lucide-react-native';
import { ChickenLot, ChickenHouse, MortalityRecord, ProductionRecord } from '@/shared/types/entities';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { MortalityServiceProvider } from '@/features/mortality/services/MortalityServiceProvider';
import { ProductionServiceProvider } from '@/features/production/services/ProductionServiceProvider';
import { FeedingServiceProvider } from '@/features/feeding/services/FeedingServiceProvider';
import { EventServiceProvider } from '@/features/health-biosecurity/services/EventServiceProvider';
import { HealthEvent } from '@/features/health-biosecurity/models/HealthEvent';
import { BiosecurityEvent } from '@/features/health-biosecurity/models/BiosecurityEvent';
import { ChickenLotCompute } from '@/features/facilities/models/ChickenLot';
import { ProductionMetrics } from '@/features/production/components/ProductionMetricsCard';
import { FeedBatchWithRemaining, FeedingRecordWithMetrics } from '@/features/feeding/services/FeedingService';
import { LotDetailsProvider } from '@/features/facilities/contexts/LotDetailsContext';
import { LotDetailsTabNavigator } from '@/features/facilities/components/lot-details/LotDetailsTabNavigator';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { useSyncRefresh } from '@/shared/contexts/SyncContext';
import { theme } from '@/core/theme';

export default function LotDetailsScreen() {
  const { lotId } = useLocalSearchParams<{ lotId: string }>();
  const router = useRouter();
  const { error } = useToastContext();

  const [lot, setLot] = useState<ChickenLot | null>(null);
  const [houses, setHouses] = useState<ChickenHouse[]>([]);
  const [mortalityHistory, setMortalityHistory] = useState<MortalityRecord[]>([]);
  const [productionHistory, setProductionHistory] = useState<ProductionRecord[]>([]);
  const [productionMetrics, setProductionMetrics] = useState<ProductionMetrics | null>(null);
  const [feedingHistory, setFeedingHistory] = useState<FeedingRecordWithMetrics[]>([]);
  const [feedBatches, setFeedBatches] = useState<FeedBatchWithRemaining[]>([]);
  const [totalFeedConsumed, setTotalFeedConsumed] = useState(0);
  const [avgFeedPerHen, setAvgFeedPerHen] = useState(0);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [biosecurityEvents, setBiosecurityEvents] = useState<BiosecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLotDetails = useCallback(async () => {
    if (!lotId) return;
    try {
      setLoading(true);

      const [facilityService, mortalityService, productionService, feedingService, eventService] =
        await Promise.all([
          FacilityServiceProvider.getFacilityService(),
          MortalityServiceProvider.getMortalityService(),
          ProductionServiceProvider.getProductionService(),
          FeedingServiceProvider.getFeedingService(),
          EventServiceProvider.getEventService(),
        ]);

      const lotResult = await facilityService.getLotDetails(lotId);
      if (!lotResult.success || !lotResult.data) {
        error('No se pudo cargar el lote');
        router.back();
        return;
      }
      setLot(lotResult.data);

      const [
        housesResult,
        mortalityResult,
        productionResult,
        metricsResult,
        feedingResult,
        totalFeedResult,
        avgFeedResult,
        batchesResult,
        healthResult,
        biosecurityResult,
      ] = await Promise.all([
        facilityService.listHouses(),
        mortalityService.getMortalityHistory(lotId),
        productionService.getProductionHistory(lotId),
        productionService.calculateMetrics(lotId),
        feedingService.getFeedingHistory(lotId),
        feedingService.calculateTotalFeedConsumed(lotId),
        feedingService.calculateAverageFeedPerHen(lotId),
        feedingService.listFeedBatches(),
        eventService.getHealthEventsByLot(lotId),
        eventService.listBiosecurityEvents(),
      ]);

      if (housesResult.success && housesResult.data) setHouses(housesResult.data);
      if (mortalityResult.success && mortalityResult.data) setMortalityHistory(mortalityResult.data);
      if (productionResult.success && productionResult.data) setProductionHistory(productionResult.data);
      if (metricsResult.success && metricsResult.data) setProductionMetrics(metricsResult.data);
      if (feedingResult.success && feedingResult.data) setFeedingHistory(feedingResult.data);
      if (totalFeedResult.success && totalFeedResult.data !== undefined) setTotalFeedConsumed(totalFeedResult.data);
      if (avgFeedResult.success && avgFeedResult.data !== undefined) setAvgFeedPerHen(avgFeedResult.data);
      if (batchesResult.success && batchesResult.data) setFeedBatches(batchesResult.data);
      if (healthResult.success && healthResult.data) setHealthEvents(healthResult.data);
      if (biosecurityResult.success && biosecurityResult.data) setBiosecurityEvents(biosecurityResult.data);
    } catch {
      error('Error al cargar detalles del lote');
    } finally {
      setLoading(false);
    }
  }, [lotId, router, error]);

  useFocusEffect(useCallback(() => { loadLotDetails(); }, [loadLotDetails]));
  useSyncRefresh(loadLotDetails);

  const getHouseName = (houseId: string) =>
    houses.find((h) => h.id === houseId)?.name ?? 'Galpón desconocido';

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading || !lot) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.colors.primary['500']} />
          <Text className="mt-lg text-textSecondary">Cargando detalles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentAge = ChickenLotCompute.calculateCurrentAgeWeeks(lot);
  const totalMortality = ChickenLotCompute.calculateTotalMortality(lot);
  const mortalityRate = ChickenLotCompute.calculateMortalityRate(lot);
  const isHighMortality = mortalityRate > 10;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View className="bg-white border-b border-gray-200 px-lg pt-lg pb-md">
        <View className="flex-row items-center gap-md mb-xs">
          <Pressable
            onPress={() => router.push('/lots')}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            accessibilityRole="button"
            accessibilityLabel="Volver a lotes"
          >
            <ArrowLeft size={24} color={theme.colors.primary['500']} />
          </Pressable>

          <View className="flex-1 flex-row items-center gap-sm">
            <Bird size={24} color={theme.colors.primary['500']} />
            <Text className="text-xl font-bold text-textPrimary flex-1" numberOfLines={1}>
              {lot.name}
            </Text>
          </View>
        </View>

        <Text className="text-xs text-textSecondary ml-10">
          {getHouseName(lot.chickenHouseId)} · Compra:{' '}
          {new Date(lot.purchaseDate + 'T12:00:00').toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* ── MÉTRICAS GENERALES (siempre visibles) ──────────────────────────── */}
      <View className="bg-white border-b border-gray-200 px-lg py-md flex-row gap-md">

        {/* Gallinas vivas */}
        <View className="flex-1 items-center py-sm">
          <Text className="text-2xl font-bold text-textPrimary">{lot.liveHenCount}</Text>
          <Text className="text-xs text-textSecondary mt-xs">Gallinas vivas</Text>
          <Text className="text-[11px] text-textTertiary">/ {lot.initialHenCount} iniciales</Text>
        </View>

        <View className="w-px bg-gray-200" />

        {/* Edad actual */}
        <View className="flex-1 items-center py-sm">
          <Text className="text-2xl font-bold text-textPrimary">{currentAge}</Text>
          <Text className="text-xs text-textSecondary mt-xs">Semanas de edad</Text>
          <Text className="text-[11px] text-textTertiary">Compra: {lot.ageWeeks} sem.</Text>
        </View>

        <View className="w-px bg-gray-200" />

        {/* Mortalidad */}
        <View className="flex-1 items-center py-sm">
          <View className="flex-row items-center gap-xs">
            <Text className={`text-2xl font-bold ${isHighMortality ? 'text-error' : 'text-textPrimary'}`}>
              {mortalityRate.toFixed(1)}%
            </Text>
            {isHighMortality && (
              <AlertTriangle size={14} color={theme.colors.error.DEFAULT} />
            )}
          </View>
          <Text className="text-xs text-textSecondary mt-xs">Mortalidad</Text>
          <Text className="text-[11px] text-textTertiary">{totalMortality} bajas</Text>
        </View>
      </View>

      {/* ── TABS ───────────────────────────────────────────────────────────── */}
      <LotDetailsProvider
        value={{
          lot,
          loading: false,
          mortalityHistory,
          productionHistory,
          productionMetrics,
          feedingHistory,
          feedBatches,
          totalFeedConsumed,
          avgFeedPerHen,
          healthEvents,
          biosecurityEvents,
        }}
      >
        <LotDetailsTabNavigator />
      </LotDetailsProvider>

    </SafeAreaView>
  );
}
