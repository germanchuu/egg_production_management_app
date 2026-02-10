/**
 * Create House Screen (Admin Only)
 *
 * Form for creating a new chicken house.
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { HouseForm } from '@/features/facilities/components/HouseForm';
import { useHouseFormActions } from '@/features/facilities/hooks/useHouseFormActions';
import { ChickenHouseFormData } from '@/features/facilities/utils/validation';
import { theme } from '@/core/theme';

export default function CreateHouseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToastContext();

  const { formLoading, handleCreateHouse } = useHouseFormActions({
    onSuccess: () => {
      router.replace('/admin/houses');
    },
    showToast: (message, type) => {
      if (type === 'success') success(message);
      else error(message);
    },
  });

  const onSubmit = async (data: ChickenHouseFormData) => {
    if (!user) {
      error('Debes estar autenticado');
      return;
    }
    await handleCreateHouse(data, user.id);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-lg py-md">
          <View className="flex-row items-center gap-md">
            <Home size={28} color={theme.colors.primary.DEFAULT} />
            <Text className="text-2xl font-bold text-textPrimary">
              Nuevo Galpón
            </Text>
          </View>
        </View>

        {/* Form */}
        <View className="px-lg py-md">
          <HouseForm
            onSubmit={onSubmit}
            isSubmitting={formLoading}
            submitLabel="Crear Galpón"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
