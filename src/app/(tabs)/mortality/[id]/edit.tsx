/**
 * Edit Mortality Record Screen
 *
 * Form for editing an existing mortality record.
 * Note: Only hens died can be edited - date and lot are immutable.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Skull, ArrowLeft, Info } from 'lucide-react-native';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useMortalityFormActions } from '@/features/mortality/hooks/useMortalityFormActions';
import { MortalityServiceProvider } from '@/features/mortality/services/MortalityServiceProvider';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { MortalityRecord, ChickenLot } from '@/shared/types/entities';
import { MortalityEditForm } from '@/features/mortality/components/MortalityEditForm';
import { theme } from '@/core/theme';

export default function EditMortalityRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToastContext();

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<MortalityRecord | null>(null);
  const [lot, setLot] = useState<ChickenLot | null>(null);

  const { formLoading, handleEditMortality } = useMortalityFormActions({
    onSuccess: () => {
      router.back();
    },
    showToast: (message, type) => {
      if (type === 'success') success(message);
      else error(message);
    },
  });

  // Load mortality record
  useEffect(() => {
    async function loadRecord() {
      try {
        setLoading(true);
        const mortService =
          await MortalityServiceProvider.getMortalityService();
        const records = await mortService.getAllMortalityRecords();

        if (records.success && records.data) {
          const found = records.data.find((r: MortalityRecord) => r.id === id);
          if (found) {
            setRecord(found);

            // Load lot details
            const facService =
              await FacilityServiceProvider.getFacilityService();
            const lotResult = await facService.getLotDetails(found.lotId);
            if (lotResult.success && lotResult.data) {
              setLot(lotResult.data);
            }
          } else {
            error('Registro no encontrado');
            router.back();
          }
        }
      } catch {
        error('Error al cargar el registro');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadRecord();
  }, [id]);

  const handleSubmit = async (hensDied: number) => {
    if (!user) {
      error('Debes estar autenticado');
      return;
    }
    await handleEditMortality(id, hensDied);
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
              <Skull size={28} color={theme.colors.primary['500']} />
              <Text className="text-2xl font-bold text-textPrimary ml-md">
                Editar Mortalidad
              </Text>
            </View>
          </View>
        </View>

        <View className="px-lg py-md">
          <Text className="text-textSecondary">Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!record || !lot) return null;

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
              onPress={() => router.back()}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <ArrowLeft size={24} color={theme.colors.primary['500']} />
            </Pressable>

            <View className="flex-1 flex-row items-center">
              <Skull size={28} color={theme.colors.primary['500']} />
              <Text className="text-2xl font-bold text-textPrimary ml-md">
                Editar Mortalidad
              </Text>
            </View>
          </View>

          <Text className="text-sm text-textSecondary mt-xs ml-10">
            Corregir cantidad de gallinas
          </Text>
        </View>

        {/* Content */}
        <View className="px-lg pt-lg">
          {/* Info Banner */}
          <View className="flex flex-row gap-1 bg-info/10 border border-info/20 rounded-xl p-lg">
            <Text className="text-sm text-primary-900 leading-relaxed">
              Solo la cantidad de gallinas puede ser editada. La fecha y el lote
              se mantienen bloqueados después de la creación. El conteo de
              gallinas vivas del lote se ajustará automáticamente.
            </Text>
          </View>

          {/* Spacer */}
          <View className="h-xl" />

          {/* Edit Form */}
          <MortalityEditForm
            record={record}
            lot={lot}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isSubmitting={formLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
