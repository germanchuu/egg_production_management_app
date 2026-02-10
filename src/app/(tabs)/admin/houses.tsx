/**
 * Chicken Houses List Screen (Admin Only)
 *
 * Displays all chicken houses and allows admins to create new ones.
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
import { useFocusEffect } from 'expo-router';
import { ChickenHouse } from '@/shared/types/entities';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { HouseForm } from '@/features/facilities/components/HouseForm';
import { ChickenHouseFormData } from '@/features/facilities/utils/validation';
import { useAuthContext } from '@/features/auth/contexts/AuthContext';

export default function HousesScreen() {
  const { currentUser } = useAuthContext();
  const [houses, setHouses] = useState<ChickenHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadHouses = useCallback(async () => {
    try {
      setLoading(true);
      const service = await FacilityServiceProvider.getFacilityService();
      const result = await service.listHouses();

      if (result.success && result.data) {
        setHouses(result.data);
      } else {
        Alert.alert('Error', result.error || 'Error al cargar galpones');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar los galpones');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHouses();
    }, [loadHouses])
  );

  const handleCreateHouse = async (data: ChickenHouseFormData) => {
    if (!currentUser) {
      Alert.alert('Error', 'Debes estar autenticado');
      return;
    }

    try {
      setIsSubmitting(true);
      const service = await FacilityServiceProvider.getFacilityService();
      const result = await service.createHouse(
        data.name,
        data.description,
        currentUser.id
      );

      if (result.success) {
        Alert.alert('Éxito', 'Galpón creado correctamente');
        setShowForm(false);
        await loadHouses();
      } else {
        Alert.alert('Error', result.error || 'Error al crear galpón');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el galpón');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Cargando galpones...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <Text className="text-2xl font-bold text-gray-900">Galpones</Text>
        <Text className="text-sm text-gray-600 mt-1">
          {houses.length} {houses.length === 1 ? 'galpón' : 'galpones'}{' '}
          registrados
        </Text>
      </View>

      {showForm ? (
        <View className="p-4 bg-white border-b border-gray-200">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">
              Nuevo Galpón
            </Text>
            <Pressable
              onPress={() => setShowForm(false)}
              className="px-4 py-2"
            >
              <Text className="text-blue-600">Cancelar</Text>
            </Pressable>
          </View>
          <HouseForm
            onSubmit={handleCreateHouse}
            isSubmitting={isSubmitting}
            submitLabel="Crear Galpón"
          />
        </View>
      ) : (
        <View className="p-4">
          <Pressable
            onPress={() => setShowForm(true)}
            className="bg-blue-600 rounded-lg p-4 items-center active:bg-blue-700"
          >
            <Text className="text-white font-bold text-base">
              + Crear Galpón
            </Text>
          </Pressable>
        </View>
      )}

      {/* Houses List */}
      {houses.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <Text className="text-6xl mb-4">🏠</Text>
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            No hay galpones registrados
          </Text>
          <Text className="text-gray-600 text-center">
            Crea tu primer galpón para comenzar a gestionar los lotes de
            gallinas
          </Text>
        </View>
      ) : (
        <FlatList
          data={houses}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4"
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <View className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <Text className="text-lg font-bold text-gray-900 mb-1">
                {item.name}
              </Text>
              {item.description && (
                <Text className="text-sm text-gray-600 mb-3">
                  {item.description}
                </Text>
              )}
              <View className="flex-row items-center">
                <Text className="text-xs text-gray-500">
                  Creado:{' '}
                  {new Date(item.createdAt).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
