/**
 * Mortality Entry Screen
 *
 * Form for recording mortality events and displaying recent entries.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { AlertTriangle, HeartPulse } from 'lucide-react-native';
import { ChickenLot, MortalityRecord } from '@/shared/types/entities';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { MortalityServiceProvider } from '@/features/mortality/services/MortalityServiceProvider';
import { MortalityForm } from '@/features/mortality/components/MortalityForm';
import { MortalityFormSkeleton } from '@/features/mortality/components/MortalityFormSkeleton';
import { MortalityHistoryList } from '@/features/mortality/components/MortalityHistoryList';
import { MortalityRecordFormData } from '@/features/mortality/utils/validation';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { useSyncRefresh } from '@/shared/contexts/SyncContext';
import { theme } from '@/core/theme';

export default function MortalityScreen() {
  const { user } = useAuth();
  const { success, error } = useToastContext();
  const [lots, setLots] = useState<ChickenLot[]>([]);
  const [recentRecords, setRecentRecords] = useState<MortalityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const facilityService =
        await FacilityServiceProvider.getFacilityService();
      const mortalityService =
        await MortalityServiceProvider.getMortalityService();

      // Load active lots
      const lotsResult = await facilityService.listActiveLots();
      if (lotsResult.success && lotsResult.data) {
        setLots(lotsResult.data);
      }

      // Load recent mortality records
      const recordsResult = await mortalityService.getAllMortalityRecords();
      if (recordsResult.success && recordsResult.data) {
        // Show last 10 records
        setRecentRecords(recordsResult.data.slice(0, 10));
      }
    } catch (err) {
      error('No se pudo cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [error]);

  // Load data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Auto-refresh when sync completes (from any screen)
  useSyncRefresh(loadData);

  const handleRecordMortality = async (data: MortalityRecordFormData) => {
    if (!user) {
      error('Debes estar autenticado');
      return;
    }

    try {
      setIsSubmitting(true);
      const service = await MortalityServiceProvider.getMortalityService();
      const result = await service.recordMortality(
        data.lotId,
        data.date,
        data.hensDied,
        user.id
      );

      if (result.success) {
        success(
          `Mortalidad registrada: ${data.hensDied} gallina${data.hensDied !== 1 ? 's' : ''}`
        );
        await loadData();
      } else {
        error(result.error || 'Error al registrar mortalidad');
      }
    } catch (err) {
      error('No se pudo registrar la mortalidad');
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
              <HeartPulse size={32} color={theme.colors.primary['500']} />
              <Text className="text-2xl font-bold text-textPrimary ml-md">
                Registro de Mortalidad
              </Text>
            </View>
            <Text className="text-sm text-textSecondary mt-xs">
              Cargando...
            </Text>
          </View>

          {/* Form Skeleton */}
          <View className="bg-white border-b border-gray-200">
            <MortalityFormSkeleton />
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
            <HeartPulse size={32} color={theme.colors.primary['500']} />
            <Text className="text-2xl font-bold text-textPrimary ml-md">
              Registro de Mortalidad
            </Text>
          </View>
          <Text className="text-sm text-textSecondary mt-xs ml-12">
            {lots.length} {lots.length === 1 ? 'lote activo' : 'lotes activos'}
          </Text>
        </View>

        {/* Mortality Form */}
        {lots.length === 0 ? (
          <View className="px-lg py-md bg-white border-b border-gray-200">
            <View className="px-xl py-2xl items-center">
              <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-lg">
                <HeartPulse size={48} color={theme.colors.primary.DEFAULT} />
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
            <MortalityForm
              lots={lots}
              onSubmit={handleRecordMortality}
              isSubmitting={isSubmitting}
            />
          </View>
        )}

        {/* Recent Entries */}
        <View className="px-lg py-md">
          <Text className="text-lg font-bold text-textPrimary mb-md">
            Registros Recientes
          </Text>
          <MortalityHistoryList
            records={recentRecords}
            lots={lots}
            emptyMessage="No hay registros de mortalidad"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
