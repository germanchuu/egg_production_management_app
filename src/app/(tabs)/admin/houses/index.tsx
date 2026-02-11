/**
 * Houses List Screen (Admin Only)
 *
 * Displays all chicken houses with sync functionality and navigation to create/edit screens.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Home, Plus } from 'lucide-react-native';
import { ChickenHouse } from '@/shared/types/entities';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { HouseCard } from '@/features/facilities/components/HouseCard';
import { HouseCardSkeleton } from '@/features/facilities/components/HouseCardSkeleton';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { theme } from '@/core/theme';
import { Button } from '@/shared/components/Button';

export default function HousesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToastContext();

  const [houses, setHouses] = useState<ChickenHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [houseToDelete, setHouseToDelete] = useState<string | null>(null);

  // Load houses
  const loadHouses = useCallback(async () => {
    try {
      setLoading(true);
      const service = await FacilityServiceProvider.getFacilityService();
      const result = await service.listHouses();
      if (result.success && result.data) {
        setHouses(result.data);
      } else {
        error(result.error || 'Error al cargar galpones');
      }
    } catch (err) {
      error('Error al cargar galpones');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useFocusEffect(
    useCallback(() => {
      loadHouses();
    }, [loadHouses])
  );

  // Delete handler
  const handleDeleteRequest = (houseId: string) => {
    setHouseToDelete(houseId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!houseToDelete || !user) return;

    try {
      const service = await FacilityServiceProvider.getFacilityService();
      const result = await service.deleteHouse(houseToDelete, user.id);

      if (result.success) {
        success('Galpón eliminado');
        loadHouses();
      } else {
        error(result.error || 'Error al eliminar');
      }
    } catch (err) {
      error('Error al eliminar galpón');
    } finally {
      setShowDeleteDialog(false);
      setHouseToDelete(null);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Header with Icon */}
      <View className="bg-white border-b border-gray-200 px-lg py-md">
        <View className="flex-row items-center gap-md mb-xs">
          <Home size={28} color={theme.colors.primary.DEFAULT} />
          <Text className="text-2xl font-bold text-textPrimary">Galpones</Text>
        </View>
        <Text className="text-sm text-textSecondary">
          {houses.length} {houses.length === 1 ? 'galpón' : 'galpones'}
        </Text>
      </View>

      {/* Create Button */}
      <View className="px-lg py-md">
        <Button
          variant="primary"
          icon={Plus}
          onPress={() => router.push('/admin/houses/create')}
        >
          Crear Galpón
        </Button>
      </View>

      {/* List */}
      {loading ? (
        <ScrollView className="px-lg">
          <View className="gap-md">
            <HouseCardSkeleton />
            <HouseCardSkeleton />
            <HouseCardSkeleton />
          </View>
        </ScrollView>
      ) : houses.length === 0 ? (
        <View className="flex-1 justify-center items-center px-xl py-2xl">
          <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-lg">
            <Home size={64} color={theme.colors.primary.DEFAULT} />
          </View>
          <Text className="text-xl font-semibold text-textPrimary text-center mb-sm">
            No hay galpones registrados
          </Text>
          <Text className="text-base text-textSecondary text-center">
            Crea tu primer galpón para comenzar
          </Text>
        </View>
      ) : (
        <FlatList
          data={houses}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-lg py-md"
          ItemSeparatorComponent={() => <View className="h-md" />}
          renderItem={({ item }) => (
            <HouseCard
              house={item}
              onEdit={() => router.push(`/admin/houses/${item.id}`)}
              onDelete={() => handleDeleteRequest(item.id)}
            />
          )}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Eliminar Galpón"
        message="¿Estás seguro de que deseas eliminar este galpón? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setHouseToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}
