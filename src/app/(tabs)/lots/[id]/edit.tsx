/**
 * Edit Lot Screen
 *
 * Form for editing an existing chicken lot.
 * Note: Only the lot name can be edited - other fields are immutable.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Bird, ArrowLeft, Info } from 'lucide-react-native';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { FormInput } from '@/shared/components/FormInput';
import { Button } from '@/shared/components/Button';
import { useLotFormActions } from '@/features/facilities/hooks/useLotFormActions';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { ChickenLot, ChickenHouse } from '@/shared/types/entities';
import { theme } from '@/core/theme';

export default function EditLotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToastContext();

  const [loading, setLoading] = useState(true);
  const [lot, setLot] = useState<ChickenLot | null>(null);
  const [houses, setHouses] = useState<ChickenHouse[]>([]);
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

        // Load houses for house names
        const housesResult = await service.listHouses();
        if (housesResult.success && housesResult.data) {
          setHouses(housesResult.data);
        }
      } catch {
        error('Error al cargar el lote');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadLot();
  }, [id]);

  const getHouseName = (houseId: string) => {
    return houses.find((h) => h.id === houseId)?.name || 'Galpón desconocido';
  };

  const handleSubmit = async () => {
    if (!user) {
      error('Debes estar autenticado');
      return;
    }

    if (!name.trim()) {
      error('El nombre es requerido');
      return;
    }

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
        <View className="bg-white border-b border-gray-200 px-lg pt-xl pb-md">
          <View className="flex-row items-center gap-md">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <ArrowLeft size={24} color={theme.colors.primary['500']} />
            </Pressable>

            <View className="flex-1 flex-row items-center">
              <Bird size={28} color={theme.colors.primary['500']} />
              <Text className="text-2xl font-bold text-textPrimary ml-md">
                Editar Lote
              </Text>
            </View>
          </View>

          <Text className="text-sm text-textSecondary mt-xs ml-10">
            Cargando información del lote...
          </Text>
        </View>

        <View className="px-lg py-md">
          <Text className="text-textSecondary">Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lot) return null;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-lg pt-xl pb-md">
          <View className="flex-row items-center gap-md">
            <Pressable
              onPress={() => router.push('/lots')}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <ArrowLeft size={24} color={theme.colors.primary['500']} />
            </Pressable>

            <View className="flex-1 flex-row items-center">
              <Bird size={28} color={theme.colors.primary['500']} />
              <Text className="text-2xl font-bold text-textPrimary ml-md">
                Editar Lote
              </Text>
            </View>
          </View>

          <Text className="text-sm text-textSecondary mt-xs ml-10">
            Modificar el nombre del lote
          </Text>
        </View>

        {/* Content */}
        <View className="px-lg pt-lg">
          {/* Info Banner */}
          <View className="flex flex-row gap-1 bg-info/10 border border-info/20 rounded-xl p-lg">
            <Info size={18} color={theme.colors.primary.DEFAULT} />
            <Text className="text-sm text-primary-900 leading-relaxed">
              Solo el nombre del lote puede ser editado. Los demás campos
              (galpón, fecha, gallinas iniciales y edad) se mantienen bloqueados
              después de la creación.
            </Text>
          </View>

          {/* Spacer between banner and form */}
          <View className="h-xl" />

          {/* Editable field */}
          <FormInput
            label="Nombre del lote"
            value={name}
            onChangeText={setName}
            placeholder="Ej: Lote Marzo 2024"
            required
            autoCapitalize="words"
            maxLength={100}
          />

          {/* Read-only section */}
          <View className="mt-sm border-t border-gray-200 pt-lg">
            <Text className="text-base font-semibold text-textPrimary mb-md">
              Información del lote
            </Text>

            <View className="gap-lg">
              <View>
                <Text className="text-xs text-textTertiary mb-xs">Galpón</Text>
                <Text className="text-base text-textSecondary">
                  {getHouseName(lot.chickenHouseId)}
                </Text>
              </View>

              <View>
                <Text className="text-xs text-textTertiary mb-xs">
                  Fecha de compra
                </Text>
                <Text className="text-base text-textSecondary">
                  {new Date(lot.purchaseDate).toLocaleDateString('es-ES')}
                </Text>
              </View>

              <View className="flex-row gap-md">
                <View className="flex-1">
                  <Text className="text-xs text-textTertiary mb-xs">
                    Gallinas iniciales
                  </Text>
                  <Text className="text-base text-textSecondary">
                    {lot.initialHenCount}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="text-xs text-textTertiary mb-xs">
                    Edad inicial (semanas)
                  </Text>
                  <Text className="text-base text-textSecondary">
                    {lot.ageWeeks}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Spacer between read-only fields and button */}
          <View className="h-2xl" />

          {/* Submit */}
          <Button onPress={handleSubmit} disabled={formLoading}>
            {formLoading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
