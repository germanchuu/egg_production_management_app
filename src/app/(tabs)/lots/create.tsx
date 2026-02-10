/**
 * Create Lot Screen
 *
 * Form for creating a new chicken lot.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bird } from 'lucide-react-native';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { LotForm } from '@/features/facilities/components/LotForm';
import { LotFormSkeleton } from '@/features/facilities/components/LotFormSkeleton';
import { useLotFormActions } from '@/features/facilities/hooks/useLotFormActions';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { ChickenHouse } from '@/shared/types/entities';
import { ChickenLotFormData } from '@/features/facilities/utils/validation';
import { theme } from '@/core/theme';

export default function CreateLotScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToastContext();

  const [houses, setHouses] = useState<ChickenHouse[]>([]);
  const [loadingHouses, setLoadingHouses] = useState(true);

  const { formLoading, handleCreateLot } = useLotFormActions({
    onSuccess: () => {
      router.replace('/lots');
    },
    showToast: (message, type) => {
      if (type === 'success') success(message);
      else error(message);
    },
  });

  // Load houses for picker
  useEffect(() => {
    async function loadHouses() {
      try {
        setLoadingHouses(true);
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
        setLoadingHouses(false);
      }
    }
    loadHouses();
  }, []);

  const onSubmit = async (data: ChickenLotFormData) => {
    if (!user) {
      error('Debes estar autenticado');
      return;
    }
    await handleCreateLot(data, user.id);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-lg py-md">
          <View className="flex-row items-center gap-md">
            <Bird size={28} color={theme.colors.primary.DEFAULT} />
            <Text className="text-2xl font-bold text-textPrimary">
              Nuevo Lote
            </Text>
          </View>
        </View>

        {/* Form */}
        {loadingHouses ? (
          <LotFormSkeleton />
        ) : houses.length === 0 ? (
          <View className="px-lg py-md">
            <Text className="text-textSecondary text-center">
              Primero debes crear un galpón
            </Text>
          </View>
        ) : (
          <View className="px-lg py-md">
            <LotForm
              houses={houses}
              onSubmit={onSubmit}
              isSubmitting={formLoading}
              submitLabel="Crear Lote"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
