/**
 * Chicken Lots List Screen
 *
 * Displays all active chicken lots with their statistics.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChickenLot, ChickenHouse } from '@/shared/types/entities';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { LotCard } from '@/features/facilities/components/LotCard';
import { LotForm } from '@/features/facilities/components/LotForm';
import { ChickenLotFormData } from '@/features/facilities/utils/validation';
import { useAuthContext } from '@/features/auth/contexts/AuthContext';

export default function LotsScreen() {
  const router = useRouter();
  const { currentUser } = useAuthContext();
  const [lots, setLots] = useState<ChickenLot[]>([]);
  const [houses, setHouses] = useState<ChickenHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const service = await FacilityServiceProvider.getFacilityService();

      // Load lots
      const lotsResult = activeOnly
        ? await service.listActiveLots()
        : await service.listLots();

      if (lotsResult.success && lotsResult.data) {
        setLots(lotsResult.data);
      }

      // Load houses for form
      const housesResult = await service.listHouses();
      if (housesResult.success && housesResult.data) {
        setHouses(housesResult.data);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar los lotes');
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleCreateLot = async (data: ChickenLotFormData) => {
    if (!currentUser) {
      Alert.alert('Error', 'Debes estar autenticado');
      return;
    }

    try {
      setIsSubmitting(true);
      const service = await FacilityServiceProvider.getFacilityService();
      const result = await service.createLot(
        data.name,
        data.chickenHouseId,
        data.purchaseDate,
        data.initialHenCount,
        data.ageWeeks,
        currentUser.id
      );

      if (result.success) {
        Alert.alert('Éxito', 'Lote creado correctamente');
        setShowForm(false);
        await loadData();
      } else {
        Alert.alert('Error', result.error || 'Error al crear lote');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el lote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHouseName = (houseId: string) => {
    return houses.find((h) => h.id === houseId)?.name || 'Galpón desconocido';
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Cargando lotes...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <Text className="text-2xl font-bold text-gray-900">Lotes</Text>
        <Text className="text-sm text-gray-600 mt-1">
          {lots.length} {lots.length === 1 ? 'lote' : 'lotes'}{' '}
          {activeOnly ? 'activos' : 'totales'}
        </Text>

        {/* Filter Toggle */}
        <View className="flex-row mt-3 gap-2">
          <Pressable
            onPress={() => setActiveOnly(true)}
            className={`flex-1 py-2 px-4 rounded-lg ${activeOnly ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <Text
              className={`text-center font-medium ${activeOnly ? 'text-white' : 'text-gray-700'}`}
            >
              Activos
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveOnly(false)}
            className={`flex-1 py-2 px-4 rounded-lg ${!activeOnly ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <Text
              className={`text-center font-medium ${!activeOnly ? 'text-white' : 'text-gray-700'}`}
            >
              Todos
            </Text>
          </Pressable>
        </View>
      </View>

      {showForm ? (
        <View className="p-4 bg-white border-b border-gray-200">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">Nuevo Lote</Text>
            <Pressable
              onPress={() => setShowForm(false)}
              className="px-4 py-2"
            >
              <Text className="text-blue-600">Cancelar</Text>
            </Pressable>
          </View>
          {houses.length === 0 ? (
            <Text className="text-gray-600 text-center">
              Primero debes crear un galpón
            </Text>
          ) : (
            <LotForm
              houses={houses}
              onSubmit={handleCreateLot}
              isSubmitting={isSubmitting}
            />
          )}
        </View>
      ) : (
        <View className="p-4">
          <Pressable
            onPress={() => setShowForm(true)}
            className="bg-blue-600 rounded-lg p-4 items-center active:bg-blue-700"
            disabled={houses.length === 0}
          >
            <Text className="text-white font-bold text-base">+ Crear Lote</Text>
          </Pressable>
        </View>
      )}

      {/* Lots List */}
      {lots.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <Text className="text-6xl mb-4">🐔</Text>
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            No hay lotes {activeOnly ? 'activos' : 'registrados'}
          </Text>
          <Text className="text-gray-600 text-center">
            {activeOnly
              ? 'Todos los lotes tienen 0 gallinas vivas'
              : 'Crea tu primer lote para comenzar'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={lots}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4"
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <LotCard
              lot={item}
              houseName={getHouseName(item.chickenHouseId)}
              onPress={() => router.push(`/lots/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}
