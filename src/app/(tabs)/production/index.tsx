/**
 * Production Entry Screen
 *
 * Main screen for recording daily egg production.
 * Features:
 * - Production entry form at top (≤3 taps: lot, eggs, save)
 * - Recent production records below
 * - Smart defaults (recent lot, today's date)
 * - Works fully offline with sync queue
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Egg } from 'lucide-react-native';
import { ChickenLot } from '@/shared/types/entities';
import { ProductionRecord } from '@/features/production/models/ProductionRecord';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { ProductionServiceProvider } from '@/features/production/services/ProductionServiceProvider';
import { ProductionEntryForm } from '@/features/production/components/ProductionEntryForm';
import { ProductionHistoryList } from '@/features/production/components/ProductionHistoryList';
import { ProductionFormSkeleton } from '@/features/production/components/ProductionFormSkeleton';
import { ProductionRecordFormData } from '@/features/production/utils/validation';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { theme } from '@/core/theme';

export default function ProductionScreen() {
  const { user } = useAuth();
  const { success, error } = useToastContext();
  const [lots, setLots] = useState<ChickenLot[]>([]);
  const [recentRecords, setRecentRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentLotId, setRecentLotId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const facilityService =
        await FacilityServiceProvider.getFacilityService();
      const productionService =
        await ProductionServiceProvider.getProductionService();

      // Load active lots
      const lotsResult = await facilityService.listActiveLots();
      if (lotsResult.success && lotsResult.data) {
        setLots(lotsResult.data);
      }

      // Load recent production records
      const recordsResult = await productionService.getAllProductionRecords();
      if (recordsResult.success && recordsResult.data) {
        // Show last 10 records
        setRecentRecords(recordsResult.data.slice(0, 10));
      }

      // Get recent lot for smart defaults
      const recentLot = await productionService.getRecentLot();
      setRecentLotId(recentLot);
    } catch (err) {
      error('No se pudo cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRecordProduction = async (data: ProductionRecordFormData) => {
    if (!user) {
      error('Debes estar autenticado');
      return;
    }

    try {
      setIsSubmitting(true);
      const service = await ProductionServiceProvider.getProductionService();
      const result = await service.recordProduction(
        data.lotId,
        data.date,
        data.eggsCollected,
        user.id
      );

      if (result.success) {
        success(
          `Producción registrada: ${data.eggsCollected} huevo${data.eggsCollected !== 1 ? 's' : ''}`
        );
        await loadData();
      } else {
        error(result.error || 'Error al registrar producción');
      }
    } catch (err) {
      error('No se pudo registrar la producción');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
        <ScrollView className="flex-1">
          {/* Header */}
          <View className="px-lg pt-xl pb-md border-b border-gray-200">
            <View className="flex-row items-center">
              <Egg size={32} color={theme.colors.primary['500']} />
              <Text className="text-2xl font-bold text-textPrimary ml-md">
                Registro de Producción
              </Text>
            </View>
            <Text className="text-sm text-textSecondary mt-xs">
              Cargando...
            </Text>
          </View>

          {/* Form Skeleton */}
          <View className="bg-white border-b border-gray-200">
            <ProductionFormSkeleton />
          </View>

          {/* Recent Entries Skeleton */}
          <View className="px-lg py-md">
            <Text className="text-lg font-bold text-textPrimary mb-md">
              Registros Recientes
            </Text>
            <View className="bg-white rounded-md border border-gray-200 p-lg">
              <Text className="text-textTertiary text-center">Cargando...</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* Header */}
        <View className="px-lg pt-xl pb-md border-b border-gray-200">
          <View className="flex-row items-center">
            <Egg size={32} color={theme.colors.primary['500']} />
            <Text className="text-2xl font-bold text-textPrimary ml-md">
              Registro de Producción
            </Text>
          </View>
          <Text className="text-sm text-textSecondary mt-xs">
            {lots.length} {lots.length === 1 ? 'lote activo' : 'lotes activos'}
          </Text>
        </View>

        {/* Production Form */}
        {lots.length === 0 ? (
          <View className="px-lg py-md bg-white border-b border-gray-200">
            <View className="px-xl py-2xl items-center">
              <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-lg">
                <Egg size={48} color={theme.colors.primary.DEFAULT} />
              </View>
              <Text className="text-lg font-semibold text-textPrimary text-center mb-sm">
                No hay lotes activos disponibles
              </Text>
              <Text className="text-base text-textSecondary text-center">
                Todos los lotes tienen 0 gallinas vivas
              </Text>
            </View>
          </View>
        ) : (
          <View className="px-lg py-md">
            <ProductionEntryForm
              lots={lots}
              onSubmit={handleRecordProduction}
              isSubmitting={isSubmitting}
              defaultLotId={recentLotId}
            />
          </View>
        )}

        {/* Recent Entries */}
        <View className="px-lg py-md">
          <Text className="text-lg font-bold text-textPrimary mb-md">
            Registros Recientes
          </Text>
          <ProductionHistoryList
            records={recentRecords}
            lots={lots}
            emptyMessage="No hay registros de producción"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
