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
  Alert,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, BarChart3 } from 'lucide-react-native';
import { ChickenLot, ChickenHouse, MortalityRecord } from '@/shared/types/entities';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { MortalityServiceProvider } from '@/features/mortality/services/MortalityServiceProvider';
import { ChickenLotCompute } from '@/features/facilities/models/ChickenLot';
import { MortalityRecordHelper } from '@/features/mortality/models/MortalityRecord';
import { theme } from '@/core/theme';

export default function LotDetailsScreen() {
  const { lotId } = useLocalSearchParams<{ lotId: string }>();
  const router = useRouter();
  const [lot, setLot] = useState<ChickenLot | null>(null);
  const [houses, setHouses] = useState<ChickenHouse[]>([]);
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

      const lotResult = await facilityService.getLotDetails(lotId);
      if (lotResult.success && lotResult.data) {
        setLot(lotResult.data);
      } else {
        Alert.alert('Error', 'No se pudo cargar el lote');
        router.back();
        return;
      }

      const mortalityResult = await mortalityService.getMortalityHistory(lotId);
      if (mortalityResult.success && mortalityResult.data) {
        setMortalityHistory(mortalityResult.data);
      }

      // Load houses for house names
      const housesResult = await facilityService.listHouses();
      if (housesResult.success && housesResult.data) {
        setHouses(housesResult.data);
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

          {mortalityHistory.length === 0 ? (
            <View className="bg-white rounded-xl px-xl py-2xl items-center border border-gray-200">
              <Text className="text-textTertiary text-center">
                No hay registros de mortalidad
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <ScrollView style={{ maxHeight: 260 }}>
                {mortalityHistory.map((record, index) => {
                  const isHigh = MortalityRecordHelper.isHighMortality(
                    record.hensDied,
                    lot.liveHenCount + totalMortality
                  );

                  return (
                    <View
                      key={record.id}
                      className={`p-lg ${
                        index !== 0 ? 'border-t border-gray-200' : ''
                      }`}
                    >
                      <View className="flex-row justify-between items-center">
                        <View>
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
                          <View className="bg-error/10 px-sm py-xs rounded-md flex-row items-center gap-xs">
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
              </ScrollView>
            </View>
          )}
        </View>

        {/* PRODUCCIÓN */}
        <View className="px-lg py-md">
          <Text className="text-lg font-bold text-textPrimary mb-md">
            Resumen de Producción
          </Text>

          <View className="bg-white rounded-xl px-xl py-2xl items-center border border-gray-200">
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
