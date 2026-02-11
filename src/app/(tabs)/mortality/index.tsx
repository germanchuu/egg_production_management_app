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
import { MortalityRecordFormData } from '@/features/mortality/utils/validation';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { MortalityRecordHelper } from '@/features/mortality/models/MortalityRecord';
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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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

  const getLotName = (lotId: string) => {
    return lots.find((l) => l.id === lotId)?.name || 'Lote desconocido';
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
              <Text className="text-textTertiary text-center">
                Cargando...
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
            {lots.length} {lots.length === 1 ? 'lote activo' : 'lotes activos'}
          </Text>
        </View>

        {/* Mortality Form */}
        <View className="px-lg py-md bg-white border-b border-gray-200">
          {lots.length === 0 ? (
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
          ) : (
            <MortalityForm
              lots={lots}
              onSubmit={handleRecordMortality}
              isSubmitting={isSubmitting}
            />
          )}
        </View>

        {/* Recent Entries */}
        <View className="px-lg py-md">
          <Text className="text-lg font-bold text-textPrimary mb-md">
            Registros Recientes
          </Text>
          {recentRecords.length === 0 ? (
            <View className="bg-white rounded-md px-xl py-2xl items-center border border-gray-200">
              <Text className="text-textTertiary text-center">
                No hay registros de mortalidad
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-md border border-gray-200 overflow-hidden">
              {recentRecords.map((record, index) => {
                const lot = lots.find((l) => l.id === record.lotId);
                const isHigh = lot
                  ? MortalityRecordHelper.isHighMortality(
                      record.hensDied,
                      lot.liveHenCount
                    )
                  : false;

                return (
                  <View
                    key={record.id}
                    className={`p-lg ${index !== 0 ? 'border-t border-gray-200' : ''}`}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-base font-medium text-textPrimary">
                          {record.hensDied} gallina
                          {record.hensDied !== 1 ? 's' : ''}
                        </Text>
                        <Text className="text-sm text-textSecondary mt-xs">
                          {getLotName(record.lotId)}
                        </Text>
                        <Text className="text-xs text-textTertiary mt-xs">
                          {new Date(record.date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      {isHigh && (
                        <View className="bg-error/10 px-sm py-xs rounded-sm flex-row items-center gap-xs">
                          <AlertTriangle
                            size={12}
                            color={theme.colors.error.DEFAULT}
                          />
                          <Text className="text-xs font-medium text-error">
                            Alta
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
