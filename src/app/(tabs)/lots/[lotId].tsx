/**
 * Lot Details Screen
 *
 * Displays detailed information about a chicken lot including:
 * - Lot info and stats
 * - Mortality history
 * - Production summary (placeholder)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { ChickenLot, MortalityRecord } from '@/shared/types/entities';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { MortalityServiceProvider } from '@/features/mortality/services/MortalityServiceProvider';
import { ChickenLotCompute } from '@/features/facilities/models/ChickenLot';
import { MortalityRecordHelper } from '@/features/mortality/models/MortalityRecord';
import { theme } from '@/core/theme';

export default function LotDetailsScreen() {
  const { lotId } = useLocalSearchParams<{ lotId: string }>();
  const router = useRouter();
  const [lot, setLot] = useState<ChickenLot | null>(null);
  const [mortalityHistory, setMortalityHistory] = useState<MortalityRecord[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const loadLotDetails = useCallback(async () => {
    if (!lotId) return;

    try {
      setLoading(true);
      const facilityService =
        await FacilityServiceProvider.getFacilityService();
      const mortalityService =
        await MortalityServiceProvider.getMortalityService();

      // Load lot
      const lotResult = await facilityService.getLotDetails(lotId);
      if (lotResult.success && lotResult.data) {
        setLot(lotResult.data);
      } else {
        Alert.alert('Error', 'No se pudo cargar el lote');
        router.back();
        return;
      }

      // Load mortality history
      const mortalityResult = await mortalityService.getMortalityHistory(lotId);
      if (mortalityResult.success && mortalityResult.data) {
        setMortalityHistory(mortalityResult.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Error al cargar detalles del lote');
    } finally {
      setLoading(false);
    }
  }, [lotId, router]);

  useFocusEffect(
    useCallback(() => {
      loadLotDetails();
    }, [loadLotDetails])
  );

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
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-lg py-md">
          <Text className="text-2xl font-bold text-textPrimary">{lot.name}</Text>
          <Text className="text-sm text-textSecondary mt-xs">
            Fecha de compra:{' '}
            {new Date(lot.purchaseDate).toLocaleDateString('es-ES')}
          </Text>
        </View>

        {/* Stats Cards */}
        <View className="px-lg py-md gap-md">
          {/* Live Hens Card */}
          <View className="bg-white rounded-md p-lg border border-gray-200">
            <Text className="text-sm text-textTertiary mb-xs">Gallinas Vivas</Text>
            <Text className="text-3xl font-bold text-textPrimary">
              {lot.liveHenCount}
            </Text>
            <Text className="text-sm text-textSecondary mt-xs">
              de {lot.initialHenCount} iniciales
            </Text>
          </View>

          {/* Age Card */}
          <View className="bg-white rounded-md p-lg border border-gray-200">
            <Text className="text-sm text-textTertiary mb-xs">Edad Actual</Text>
            <Text className="text-3xl font-bold text-textPrimary">
              {currentAge} semanas
            </Text>
            <Text className="text-sm text-textSecondary mt-xs">
              Edad inicial: {lot.ageWeeks} semanas
            </Text>
          </View>

          {/* Mortality Card */}
          <View className="bg-white rounded-md p-lg border border-gray-200">
            <Text className="text-sm text-textTertiary mb-xs">Mortalidad Total</Text>
            <Text
              className={`text-3xl font-bold ${mortalityRate > 10 ? 'text-error' : 'text-textPrimary'}`}
            >
              {mortalityRate.toFixed(1)}%
            </Text>
            <Text className="text-sm text-textSecondary mt-xs">
              {totalMortality} gallinas ({mortalityHistory.length} eventos)
            </Text>
            {mortalityRate > 10 && (
              <View className="flex-row items-center gap-xs mt-xs">
                <AlertTriangle size={14} color={theme.colors.error.DEFAULT} />
                <Text className="text-sm text-error">Alta mortalidad</Text>
              </View>
            )}
          </View>
        </View>

        {/* Mortality History */}
        <View className="px-lg py-md">
          <Text className="text-lg font-bold text-textPrimary mb-md">
            Historial de Mortalidad
          </Text>
          {mortalityHistory.length === 0 ? (
            <View className="bg-white rounded-md px-xl py-2xl items-center border border-gray-200">
              <Text className="text-textTertiary text-center">
                No hay registros de mortalidad
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-md border border-gray-200 overflow-hidden">
              {mortalityHistory.map((record, index) => {
                const isHigh = MortalityRecordHelper.isHighMortality(
                  record.hensDied,
                  lot.liveHenCount + totalMortality
                );
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
                          {new Date(record.date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      {isHigh && (
                        <View className="bg-error/10 px-sm py-xs rounded-sm flex-row items-center gap-xs">
                          <AlertTriangle size={12} color={theme.colors.error.DEFAULT} />
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

        {/* Production Summary Placeholder */}
        <View className="px-lg py-md">
          <Text className="text-lg font-bold text-textPrimary mb-md">
            Resumen de Producción
          </Text>
          <View className="bg-white rounded-md px-xl py-2xl items-center border border-gray-200">
            <Text className="text-textTertiary text-center">
              Funcionalidad en desarrollo
            </Text>
            <Text className="text-sm text-gray-400 text-center mt-sm">
              (User Story 1 - Production)
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
