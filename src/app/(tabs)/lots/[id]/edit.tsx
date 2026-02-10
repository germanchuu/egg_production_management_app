/**
 * Edit Lot Screen
 *
 * Form for editing an existing chicken lot.
 * Note: Only the lot name can be edited - other fields are immutable.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Bird } from 'lucide-react-native';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { FormInput } from '@/shared/components/FormInput';
import { Button } from '@/shared/components/Button';
import { useLotFormActions } from '@/features/facilities/hooks/useLotFormActions';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { ChickenLot } from '@/shared/types/entities';
import { theme } from '@/core/theme';

export default function EditLotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToastContext();

  const [loading, setLoading] = useState(true);
  const [lot, setLot] = useState<ChickenLot | null>(null);
  const [name, setName] = useState('');

  const { formLoading, handleEditLot } = useLotFormActions({
    onSuccess: () => {
      router.back();
    },
    showToast: (message, type) => {
      if (type === 'success') success(message);
      else error(message);
    },
  });

  // Load lot data
  useEffect(() => {
    async function loadLot() {
      try {
        setLoading(true);
        const service = await FacilityServiceProvider.getFacilityService();
        const result = await service.getLotDetails(id);
        if (result.success && result.data) {
          setLot(result.data);
          setName(result.data.name);
        } else {
          error(result.error || 'Lote no encontrado');
          router.back();
        }
      } catch (err) {
        error('Error al cargar el lote');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadLot();
  }, [id]);

  const handleSubmit = async () => {
    if (!user) {
      error('Debes estar autenticado');
      return;
    }

    if (!name.trim()) {
      error('El nombre es requerido');
      return;
    }

    // Create form data with all fields (even though only name will be updated)
    const formData = {
      name: name.trim(),
      chickenHouseId: lot!.chickenHouseId,
      purchaseDate: lot!.purchaseDate,
      initialHenCount: lot!.initialHenCount,
      ageWeeks: lot!.ageWeeks,
    };

    await handleEditLot(id, formData, user.id);
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
        <View className="bg-white border-b border-gray-200 px-lg py-md">
          <View className="flex-row items-center gap-md">
            <Bird size={28} color={theme.colors.primary.DEFAULT} />
            <Text className="text-2xl font-bold text-textPrimary">
              Editar Lote
            </Text>
          </View>
        </View>
        <View className="px-lg py-md">
          <Text className="text-textSecondary">Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lot) {
    return null;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-lg py-md">
          <View className="flex-row items-center gap-md">
            <Bird size={28} color={theme.colors.primary.DEFAULT} />
            <Text className="text-2xl font-bold text-textPrimary">
              Editar Lote
            </Text>
          </View>
        </View>

        {/* Form */}
        <View className="px-lg py-md space-y-lg">
          {/* Info Banner */}
          <View className="bg-blue-50 border border-blue-200 rounded-md p-md">
            <Text className="text-sm text-blue-800">
              ℹ️ Solo el nombre del lote puede ser editado. Los demás campos
              (galpón, fecha, gallinas iniciales, edad) son inmutables después
              de la creación.
            </Text>
          </View>

          {/* Name Field */}
          <View>
            <FormInput
              label="Nombre del Lote"
              value={name}
              onChangeText={setName}
              placeholder="Ej: Lote Marzo 2024"
              required
              autoCapitalize="words"
              maxLength={100}
            />
          </View>

          {/* Read-only Fields Display */}
          <View className="space-y-md border-t border-gray-200 pt-lg">
            <Text className="text-base font-semibold text-textPrimary">
              Campos no editables:
            </Text>

            <View>
              <Text className="text-xs text-textTertiary mb-xs">Galpón</Text>
              <Text className="text-base text-textSecondary">
                {lot.chickenHouseId}
              </Text>
            </View>

            <View>
              <Text className="text-xs text-textTertiary mb-xs">
                Fecha de Compra
              </Text>
              <Text className="text-base text-textSecondary">
                {new Date(lot.purchaseDate).toLocaleDateString('es-ES')}
              </Text>
            </View>

            <View className="flex-row gap-md">
              <View className="flex-1">
                <Text className="text-xs text-textTertiary mb-xs">
                  Gallinas Iniciales
                </Text>
                <Text className="text-base text-textSecondary">
                  {lot.initialHenCount}
                </Text>
              </View>

              <View className="flex-1">
                <Text className="text-xs text-textTertiary mb-xs">
                  Edad Inicial (semanas)
                </Text>
                <Text className="text-base text-textSecondary">
                  {lot.ageWeeks}
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <Button onPress={handleSubmit} disabled={formLoading}>
            {formLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
