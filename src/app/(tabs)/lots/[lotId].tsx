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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChickenLot, MortalityRecord } from '@/shared/types/entities';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { MortalityServiceProvider } from '@/features/mortality/services/MortalityServiceProvider';
import { ChickenLotCompute } from '@/features/facilities/models/ChickenLot';
import { MortalityRecordHelper } from '@/features/mortality/models/MortalityRecord';

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
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Cargando detalles...</Text>
      </View>
    );
  }

  const currentAge = ChickenLotCompute.calculateCurrentAgeWeeks(lot);
  const totalMortality = ChickenLotCompute.calculateTotalMortality(lot);
  const mortalityRate = ChickenLotCompute.calculateMortalityRate(lot);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <Text className="text-2xl font-bold text-gray-900">{lot.name}</Text>
        <Text className="text-sm text-gray-600 mt-1">
          Fecha de compra:{' '}
          {new Date(lot.purchaseDate).toLocaleDateString('es-ES')}
        </Text>
      </View>

      {/* Stats Cards */}
      <View className="p-4 gap-3">
        {/* Live Hens Card */}
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <Text className="text-sm text-gray-500 mb-1">Gallinas Vivas</Text>
          <Text className="text-3xl font-bold text-gray-900">
            {lot.liveHenCount}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            de {lot.initialHenCount} iniciales
          </Text>
        </View>

        {/* Age Card */}
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <Text className="text-sm text-gray-500 mb-1">Edad Actual</Text>
          <Text className="text-3xl font-bold text-gray-900">
            {currentAge} semanas
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            Edad inicial: {lot.ageWeeks} semanas
          </Text>
        </View>

        {/* Mortality Card */}
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <Text className="text-sm text-gray-500 mb-1">Mortalidad Total</Text>
          <Text
            className={`text-3xl font-bold ${mortalityRate > 10 ? 'text-red-600' : 'text-gray-900'}`}
          >
            {mortalityRate.toFixed(1)}%
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            {totalMortality} gallinas ({mortalityHistory.length} eventos)
          </Text>
          {mortalityRate > 10 && (
            <Text className="text-sm text-red-600 mt-1">⚠️ Alta mortalidad</Text>
          )}
        </View>
      </View>

      {/* Mortality History */}
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">
          Historial de Mortalidad
        </Text>
        {mortalityHistory.length === 0 ? (
          <View className="bg-white rounded-lg p-6 items-center border border-gray-200">
            <Text className="text-gray-500 text-center">
              No hay registros de mortalidad
            </Text>
          </View>
        ) : (
          <View className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {mortalityHistory.map((record, index) => {
              const isHigh = MortalityRecordHelper.isHighMortality(
                record.hensDied,
                lot.liveHenCount + totalMortality
              );
              return (
                <View
                  key={record.id}
                  className={`p-4 ${index !== 0 ? 'border-t border-gray-200' : ''}`}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-base font-medium text-gray-900">
                        {record.hensDied} gallina
                        {record.hensDied !== 1 ? 's' : ''}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {new Date(record.date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    {isHigh && (
                      <View className="bg-red-100 px-2 py-1 rounded">
                        <Text className="text-xs font-medium text-red-800">
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
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">
          Resumen de Producción
        </Text>
        <View className="bg-white rounded-lg p-6 items-center border border-gray-200">
          <Text className="text-gray-500 text-center">
            Funcionalidad en desarrollo
          </Text>
          <Text className="text-sm text-gray-400 text-center mt-2">
            (User Story 1 - Production)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
