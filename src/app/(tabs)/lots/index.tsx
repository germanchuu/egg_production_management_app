/**
 * Chicken Lots List Screen
 *
 * Displays all chicken lots with sync functionality and filter toggle.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bird, Plus, RefreshCw } from 'lucide-react-native';
import { ChickenLot, ChickenHouse } from '@/shared/types/entities';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { LotCard } from '@/features/facilities/components/LotCard';
import { LotCardSkeleton } from '@/features/facilities/components/LotCardSkeleton';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { useSyncContext } from '@/shared/contexts/SyncContext';
import { theme } from '@/core/theme';
import { Button } from '@/shared/components/Button';

export default function LotsScreen() {
  const router = useRouter();
  const { success, error } = useToastContext();
  const { sync, status, pendingCount, getPendingEntityIds } = useSyncContext();

  const [lots, setLots] = useState<ChickenLot[]>([]);
  const [houses, setHouses] = useState<ChickenHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);
  const [pendingLotIds, setPendingLotIds] = useState<Set<string>>(new Set());

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
      } else {
        error(lotsResult.error || 'Error al cargar lotes');
      }

      // Load houses for house names
      const housesResult = await service.listHouses();
      if (housesResult.success && housesResult.data) {
        setHouses(housesResult.data);
      }

      // Load pending IDs
      const pending = await getPendingEntityIds('chicken_lots');
      setPendingLotIds(pending);
    } catch (err) {
      error('Error al cargar lotes');
    } finally {
      setLoading(false);
    }
  }, [activeOnly, error, getPendingEntityIds]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Sync handler
  const handleSync = async () => {
    try {
      await sync();
      success('Sincronización completada');
      loadData(); // Refresh
    } catch (err) {
      error('Error al sincronizar');
    }
  };

  const getHouseName = (houseId: string) => {
    return houses.find((h) => h.id === houseId)?.name || 'Galpón desconocido';
  };

  const handleCreatePress = () => {
    if (houses.length === 0) {
      error('Primero debes crear un galpón');
      return;
    }
    router.push('/lots/create');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Header with Icon */}
      <View className="bg-white border-b border-gray-200 px-lg py-md">
        <View className="flex-row items-center gap-md mb-xs">
          <Bird size={28} color={theme.colors.primary.DEFAULT} />
          <Text className="text-2xl font-bold text-textPrimary">Lotes</Text>
        </View>
        <View className="flex-row items-center justify-between mb-md">
          <Text className="text-sm text-textSecondary">
            {lots.length} {lots.length === 1 ? 'lote' : 'lotes'}{' '}
            {activeOnly ? 'activos' : 'totales'}
          </Text>

          {/* Sync Button */}
          <Pressable
            onPress={handleSync}
            disabled={status === 'syncing'}
            className={`flex-row items-center gap-xs px-md py-sm rounded-md ${
              pendingCount > 0 ? 'bg-warning/10' : 'bg-gray-100'
            }`}
          >
            <RefreshCw
              size={16}
              color={
                pendingCount > 0
                  ? theme.colors.warning.DEFAULT
                  : theme.colors.gray['600']
              }
            />
            {pendingCount > 0 && (
              <View className="bg-error rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {pendingCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Filter Toggle */}
        <View className="flex-row gap-sm">
          <Pressable
            onPress={() => setActiveOnly(true)}
            className={`flex-1 py-sm px-lg rounded-md ${activeOnly ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <Text
              className={`text-center font-medium ${activeOnly ? 'text-textInverse' : 'text-textSecondary'}`}
            >
              Activos
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveOnly(false)}
            className={`flex-1 py-sm px-lg rounded-md ${!activeOnly ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <Text
              className={`text-center font-medium ${!activeOnly ? 'text-textInverse' : 'text-textSecondary'}`}
            >
              Todos
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Create Button */}
      <View className="px-lg py-md">
        <Button
          variant="primary"
          icon={Plus}
          onPress={handleCreatePress}
          disabled={houses.length === 0}
        >
          Crear Lote
        </Button>
      </View>

      {/* Lots List */}
      {loading ? (
        <ScrollView className="px-lg">
          <View className="gap-md">
            <LotCardSkeleton />
            <LotCardSkeleton />
            <LotCardSkeleton />
          </View>
        </ScrollView>
      ) : lots.length === 0 ? (
        <View className="flex-1 justify-center items-center px-xl py-2xl">
          <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-lg">
            <Bird size={64} color={theme.colors.primary.DEFAULT} />
          </View>
          <Text className="text-xl font-semibold text-textPrimary text-center mb-sm">
            No hay lotes {activeOnly ? 'activos' : 'registrados'}
          </Text>
          <Text className="text-base text-textSecondary text-center">
            {activeOnly
              ? 'Todos los lotes tienen 0 gallinas vivas'
              : 'Crea tu primer lote para comenzar'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={lots}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-lg py-md"
          ItemSeparatorComponent={() => <View className="h-md" />}
          renderItem={({ item }) => (
            <LotCard
              lot={item}
              houseName={getHouseName(item.chickenHouseId)}
              hasPending={pendingLotIds.has(item.id)}
              onPress={() => router.push(`/lots/${item.id}`)}
              onEdit={() => router.push(`/lots/${item.id}/edit`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
