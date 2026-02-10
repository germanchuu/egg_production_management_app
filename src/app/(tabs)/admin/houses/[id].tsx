/**
 * Edit House Screen (Admin Only)
 *
 * Form for editing an existing chicken house.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Home } from 'lucide-react-native';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { HouseForm } from '@/features/facilities/components/HouseForm';
import { HouseFormSkeleton } from '@/features/facilities/components/HouseFormSkeleton';
import { useHouseFormActions } from '@/features/facilities/hooks/useHouseFormActions';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { ChickenHouse } from '@/shared/types/entities';
import { ChickenHouseFormData } from '@/features/facilities/utils/validation';
import { theme } from '@/core/theme';

export default function EditHouseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToastContext();

  const [loading, setLoading] = useState(true);
  const [house, setHouse] = useState<ChickenHouse | null>(null);

  const { formLoading, handleEditHouse } = useHouseFormActions({
    onSuccess: () => {
      router.replace('/admin/houses');
    },
    showToast: (message, type) => {
      if (type === 'success') success(message);
      else error(message);
    },
  });

  // Load house data
  useEffect(() => {
    async function loadHouse() {
      try {
        setLoading(true);
        const service = await FacilityServiceProvider.getFacilityService();
        const result = await service.getHouseDetails(id);
        if (result.success && result.data) {
          setHouse(result.data);
        } else {
          error(result.error || 'Galpón no encontrado');
          router.replace('/admin/houses');
        }
      } catch (err) {
        error('Error al cargar el galpón');
        router.replace('/admin/houses');
      } finally {
        setLoading(false);
      }
    }
    loadHouse();
  }, [id]);

  const onSubmit = async (data: ChickenHouseFormData) => {
    if (!user) {
      error('Debes estar autenticado');
      return;
    }
    await handleEditHouse(id, data, user.id);
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
        <View className="bg-white border-b border-gray-200 px-lg py-md">
          <View className="flex-row items-center gap-md">
            <Home size={28} color={theme.colors.primary.DEFAULT} />
            <Text className="text-2xl font-bold text-textPrimary">
              Editar Galpón
            </Text>
          </View>
        </View>
        <HouseFormSkeleton />
      </SafeAreaView>
    );
  }

  if (!house) {
    return null;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-lg py-md">
          <View className="flex-row items-center gap-md">
            <Home size={28} color={theme.colors.primary.DEFAULT} />
            <Text className="text-2xl font-bold text-textPrimary">
              Editar Galpón
            </Text>
          </View>
        </View>

        {/* Form */}
        <View className="px-lg py-md">
          <HouseForm
            initialValues={{
              name: house.name,
              description: house.description,
            }}
            onSubmit={onSubmit}
            isSubmitting={formLoading}
            submitLabel="Guardar Cambios"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
