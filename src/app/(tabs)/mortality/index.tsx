/**
 * Mortality Entry Screen
 *
 * Form for recording mortality events and displaying recent entries.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ChickenLot, MortalityRecord } from '@/shared/types/entities';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { MortalityServiceProvider } from '@/features/mortality/services/MortalityServiceProvider';
import { MortalityForm } from '@/features/mortality/components/MortalityForm';
import { MortalityRecordFormData } from '@/features/mortality/utils/validation';
import { useAuthContext } from '@/features/auth/contexts/AuthContext';
import { MortalityRecordHelper } from '@/features/mortality/models/MortalityRecord';

export default function MortalityScreen() {
  const { currentUser } = useAuthContext();
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
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRecordMortality = async (data: MortalityRecordFormData) => {
    if (!currentUser) {
      Alert.alert('Error', 'Debes estar autenticado');
      return;
    }

    try {
      setIsSubmitting(true);
      const service = await MortalityServiceProvider.getMortalityService();
      const result = await service.recordMortality(
        data.lotId,
        data.date,
        data.hensDied,
        currentUser.id
      );

      if (result.success) {
        Alert.alert(
          'Éxito',
          `Mortalidad registrada: ${data.hensDied} gallina${data.hensDied !== 1 ? 's' : ''}`
        );
        await loadData();
      } else {
        Alert.alert('Error', result.error || 'Error al registrar mortalidad');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar la mortalidad');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLotName = (lotId: string) => {
    return lots.find((l) => l.id === lotId)?.name || 'Lote desconocido';
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <Text className="text-2xl font-bold text-gray-900">
          Registro de Mortalidad
        </Text>
        <Text className="text-sm text-gray-600 mt-1">
          {lots.length} {lots.length === 1 ? 'lote activo' : 'lotes activos'}
        </Text>
      </View>

      {/* Mortality Form */}
      <View className="p-4 bg-white border-b border-gray-200">
        {lots.length === 0 ? (
          <View className="p-6 items-center">
            <Text className="text-gray-600 text-center mb-2">
              No hay lotes activos disponibles
            </Text>
            <Text className="text-sm text-gray-500 text-center">
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
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">
          Registros Recientes
        </Text>
        {recentRecords.length === 0 ? (
          <View className="bg-white rounded-lg p-6 items-center border border-gray-200">
            <Text className="text-gray-500 text-center">
              No hay registros de mortalidad
            </Text>
          </View>
        ) : (
          <View className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                  className={`p-4 ${index !== 0 ? 'border-t border-gray-200' : ''}`}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-base font-medium text-gray-900">
                        {record.hensDied} gallina
                        {record.hensDied !== 1 ? 's' : ''}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {getLotName(record.lotId)}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {new Date(record.date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    {isHigh && (
                      <View className="bg-red-100 px-2 py-1 rounded">
                        <Text className="text-xs font-medium text-red-800">
                          ⚠️ Alta
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
  );
}
