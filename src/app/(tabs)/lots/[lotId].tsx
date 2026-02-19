/**
 * Lot Details Screen (Improved UI)
 *
 * - Header con botón back + ícono
 * - Layout más analítico
 * - Historial con scroll interno
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, BarChart3, Wheat, Scale } from 'lucide-react-native';
import { ChickenLot, ChickenHouse, MortalityRecord, ProductionRecord } from '@/shared/types/entities';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { MortalityServiceProvider } from '@/features/mortality/services/MortalityServiceProvider';
import { ProductionServiceProvider } from '@/features/production/services/ProductionServiceProvider';
import { FeedingServiceProvider } from '@/features/feeding/services/FeedingServiceProvider';
import { ChickenLotCompute } from '@/features/facilities/models/ChickenLot';
import { MortalityHistoryList } from '@/features/mortality/components/MortalityHistoryList';
import { ProductionHistoryList } from '@/features/production/components/ProductionHistoryList';
import { ProductionMetricsCard, ProductionMetrics } from '@/features/production/components/ProductionMetricsCard';
import { FeedingHistoryList } from '@/features/feeding/components/FeedingHistoryList';
import { FeedBatchWithRemaining, FeedingRecordWithMetrics } from '@/features/feeding/services/FeedingService';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { useSyncRefresh } from '@/shared/contexts/SyncContext';
import { theme } from '@/core/theme';

export default function LotDetailsScreen() {
  const { lotId } = useLocalSearchParams<{ lotId: string }>();
  const router = useRouter();
  const { error } = useToastContext();
  const [lot, setLot] = useState<ChickenLot | null>(null);
  const [houses, setHouses] = useState<ChickenHouse[]>([]);
  const [mortalityHistory, setMortalityHistory] = useState<MortalityRecord[]>(
    []
  );
  const [productionHistory, setProductionHistory] = useState<ProductionRecord[]>(
    []
  );
  const [productionMetrics, setProductionMetrics] = useState<ProductionMetrics | null>(
    null
  );
  const [feedingHistory, setFeedingHistory] = useState<FeedingRecordWithMetrics[]>([]);
  const [feedBatches, setFeedBatches] = useState<FeedBatchWithRemaining[]>([]);
  const [totalFeedConsumed, setTotalFeedConsumed] = useState<number>(0);
  const [avgFeedPerHen, setAvgFeedPerHen] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadLotDetails = useCallback(async () => {
    if (!lotId) return;

    try {
      setLoading(true);
      const facilityService =
        await FacilityServiceProvider.getFacilityService();
      const mortalityService =
        await MortalityServiceProvider.getMortalityService();

      const lotResult = await facilityService.getLotDetails(lotId);
      if (lotResult.success && lotResult.data) {
        setLot(lotResult.data);
      } else {
        error('No se pudo cargar el lote');
        router.back();
        return;
      }

      const mortalityResult = await mortalityService.getMortalityHistory(lotId);
      if (mortalityResult.success && mortalityResult.data) {
        setMortalityHistory(mortalityResult.data);
      }

      // Load production history and metrics
      const productionService =
        await ProductionServiceProvider.getProductionService();
      const productionResult = await productionService.getProductionHistory(lotId);
      if (productionResult.success && productionResult.data) {
        setProductionHistory(productionResult.data);
      }

      const metricsResult = await productionService.calculateMetrics(lotId);
      if (metricsResult.success && metricsResult.data) {
        setProductionMetrics(metricsResult.data);
      }

      // Load feeding history and metrics
      const feedingService = await FeedingServiceProvider.getFeedingService();
      const feedingResult = await feedingService.getFeedingHistory(lotId);
      if (feedingResult.success && feedingResult.data) {
        setFeedingHistory(feedingResult.data);
      }

      const totalFeedResult = await feedingService.calculateTotalFeedConsumed(lotId);
      if (totalFeedResult.success && totalFeedResult.data !== undefined) {
        setTotalFeedConsumed(totalFeedResult.data);
      }

      const avgFeedResult = await feedingService.calculateAverageFeedPerHen(lotId);
      if (avgFeedResult.success && avgFeedResult.data !== undefined) {
        setAvgFeedPerHen(avgFeedResult.data);
      }

      const batchesResult = await feedingService.listFeedBatches();
      if (batchesResult.success && batchesResult.data) {
        setFeedBatches(batchesResult.data);
      }

      // Load houses for house names
      const housesResult = await facilityService.listHouses();
      if (housesResult.success && housesResult.data) {
        setHouses(housesResult.data);
      }
    } catch (err) {
      error('Error al cargar detalles del lote');
    } finally {
      setLoading(false);
    }
  }, [lotId, router, error]);

  // Load data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadLotDetails();
    }, [loadLotDetails])
  );

  // Auto-refresh when sync completes (from any screen)
  useSyncRefresh(loadLotDetails);

  const getHouseName = (houseId: string) => {
    return houses.find((h) => h.id === houseId)?.name || 'Galpón desconocido';
  };

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

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* HEADER */}
        <View className="bg-white border-b border-gray-200 px-lg pt-xl pb-md">
          <View className="flex-row items-center gap-md">
            <Pressable
              onPress={() => router.push('/lots')}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <ArrowLeft size={24} color={theme.colors.primary['500']} />
            </Pressable>

            <View className="flex-1 flex-row items-center">
              <BarChart3 size={28} color={theme.colors.primary['500']} />
              <Text className="text-2xl font-bold text-textPrimary ml-md">
                {lot.name}
              </Text>
            </View>
          </View>

          <Text className="text-sm text-textSecondary mt-xs ml-10">
            Fecha de compra:{' '}
            {new Date(lot.purchaseDate).toLocaleDateString('es-ES')}
          </Text>
          <Text className="text-sm text-textSecondary mt-xs ml-10">
            Galpón: {getHouseName(lot.chickenHouseId)}
          </Text>
        </View>

        {/* DASHBOARD ANALÍTICO */}
        <View className="px-lg py-md gap-md">
          {/* MÉTRICA PRINCIPAL */}
          <View className="bg-white rounded-2xl p-xl border border-gray-200 shadow-sm">
            <Text className="text-xs text-textTertiary mb-xs">
              Gallinas vivas
            </Text>

            <View className="flex-row items-end justify-between">
              <Text className="text-4xl font-bold text-textPrimary">
                {lot.liveHenCount}
              </Text>

              <View className="items-end">
                <Text className="text-xs text-textTertiary">Inicial</Text>
                <Text className="text-lg font-semibold text-textSecondary">
                  {lot.initialHenCount}
                </Text>
              </View>
            </View>
          </View>

          {/* GRID SECUNDARIO */}
          <View className="flex-row gap-md">
            {/* EDAD */}
            <View className="flex-1 bg-white rounded-2xl p-lg border border-gray-200 shadow-sm">
              <Text className="text-xs text-textTertiary mb-xs">
                Edad actual
              </Text>

              <Text className="text-2xl font-bold text-textPrimary">
                {currentAge} semanas
              </Text>

              <Text className="text-xs text-textTertiary mt-sm">
                Inicial: {lot.ageWeeks}{' '}
                {lot.ageWeeks === 1 ? 'semana' : 'semanas'}
              </Text>
            </View>

            {/* MORTALIDAD */}
            <View className="flex-1 bg-white rounded-2xl p-lg border border-gray-200 shadow-sm">
              <Text className="text-xs text-textTertiary mb-xs">
                Mortalidad
              </Text>

              <Text
                className={`text-2xl font-bold ${
                  mortalityRate > 10 ? 'text-error' : 'text-textPrimary'
                }`}
              >
                {mortalityRate.toFixed(1)}%
              </Text>

              <Text className="text-xs text-textSecondary mt-xs">
                {totalMortality} {totalMortality === 1 ? 'gallina' : 'gallinas'}
              </Text>

              {mortalityRate > 10 && (
                <View className="flex-row items-center gap-xs mt-sm bg-error/10 px-sm py-xs rounded-md self-start">
                  <AlertTriangle size={12} color={theme.colors.error.DEFAULT} />
                  <Text className="text-[11px] font-medium text-error">
                    Alta
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* HISTORIAL MORTALIDAD*/}
        <View className="px-lg py-md">
          <Text className="text-lg font-bold text-textPrimary mb-md">
            Historial de Mortalidad
          </Text>

          <MortalityHistoryList
            records={mortalityHistory}
            lots={lot ? [lot] : []}
            emptyMessage="No hay registros de mortalidad"
          />
        </View>

        {/* PRODUCCIÓN - MÉTRICAS */}
        {productionMetrics && (
          <View className="px-lg py-md">
            <Text className="text-lg font-bold text-textPrimary mb-md">
              Métricas de Producción
            </Text>
            <ProductionMetricsCard
              metrics={productionMetrics}
              lotName={lot.name}
            />
          </View>
        )}

        {/* PRODUCCIÓN - HISTORIAL */}
        <View className="px-lg py-md">
          <Text className="text-lg font-bold text-textPrimary mb-md">
            Historial de Producción
          </Text>
          {productionHistory.length === 0 ? (
            <View className="bg-white rounded-xl px-xl py-2xl items-center border border-gray-200">
              <Text className="text-textTertiary text-center">
                No hay registros de producción
              </Text>
            </View>
          ) : (
            <View style={{ maxHeight: 400 }}>
              <ScrollView>
                <ProductionHistoryList
                  records={productionHistory.slice(0, 10)}
                  lots={[lot]}
                  emptyMessage="No hay registros de producción para este lote"
                />
              </ScrollView>
            </View>
          )}
        </View>

        {/* ALIMENTACIÓN - MÉTRICAS */}
        {totalFeedConsumed > 0 && (
          <View className="px-lg py-md">
            <Text className="text-lg font-bold text-textPrimary mb-md">
              Métricas de Alimentación
            </Text>
            <View className="flex-row gap-md">
              <View className="flex-1 bg-white rounded-md border border-gray-100 shadow-sm p-md">
                <View className="flex-row items-center gap-sm mb-xs">
                  <View className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center">
                    <Scale size={16} color={theme.colors.primary['600']} />
                  </View>
                  <Text className="text-xs text-textSecondary">Total consumido</Text>
                </View>
                <Text className="text-2xl font-bold text-textPrimary">
                  {totalFeedConsumed.toFixed(2)}
                </Text>
                <Text className="text-xs text-textTertiary mt-xs">kg</Text>
              </View>
              <View className="flex-1 bg-white rounded-md border border-gray-100 shadow-sm p-md">
                <View className="flex-row items-center gap-sm mb-xs">
                  <View className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center">
                    <Wheat size={16} color={theme.colors.primary['600']} />
                  </View>
                  <Text className="text-xs text-textSecondary">Promedio/gallina</Text>
                </View>
                <Text className="text-2xl font-bold text-textPrimary">
                  {avgFeedPerHen.toFixed(4)}
                </Text>
                <Text className="text-xs text-textTertiary mt-xs">kg/gallina</Text>
              </View>
            </View>
          </View>
        )}

        {/* ALIMENTACIÓN - HISTORIAL */}
        <View className="px-lg py-md">
          <Text className="text-lg font-bold text-textPrimary mb-md">
            Historial de Alimentación
          </Text>
          <View style={{ maxHeight: 400 }}>
            <ScrollView>
              <FeedingHistoryList
                records={feedingHistory.slice(0, 10)}
                feedBatches={feedBatches}
                liveHenCount={lot.liveHenCount}
                emptyMessage="No hay registros de alimentación para este lote"
              />
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
