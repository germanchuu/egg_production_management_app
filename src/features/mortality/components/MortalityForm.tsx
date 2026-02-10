/**
 * MortalityForm Component
 *
 * Form for recording mortality events.
 * Uses react-hook-form with Zod validation.
 * Validates hensDied against lot's current liveHenCount.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  mortalityRecordSchema,
  MortalityRecordFormData,
  validateHensDiedAgainstLiveCount,
  isHighMortality,
} from '../utils/validation';
import { FormInput } from '@/shared/components/FormInput';
import { DatePicker } from '@/shared/components/DatePicker';
import { Button } from '@/shared/components/Button';
import { ChickenLot } from '@/shared/types/entities';

interface MortalityFormProps {
  lots: ChickenLot[];
  onSubmit: (data: MortalityRecordFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export const MortalityForm: React.FC<MortalityFormProps> = ({
  lots,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Registrar',
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<MortalityRecordFormData>({
    resolver: zodResolver(mortalityRecordSchema),
    defaultValues: {
      lotId: lots.filter((l) => l.liveHenCount > 0)[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      hensDied: 0,
    },
  });

  const selectedLotId = watch('lotId');
  const hensDied = watch('hensDied');
  const selectedLot = lots.find((l) => l.id === selectedLotId);

  const handleFormSubmit = (data: MortalityRecordFormData) => {
    if (!selectedLot) {
      setError('lotId', { message: 'Debe seleccionar un lote' });
      return;
    }

    // Validate against live hen count
    const validation = validateHensDiedAgainstLiveCount(
      data.hensDied,
      selectedLot.liveHenCount
    );

    if (!validation.valid) {
      setError('hensDied', { message: validation.error });
      return;
    }

    onSubmit(data);
  };

  // Check if mortality is high
  const showHighMortalityWarning =
    selectedLot &&
    hensDied > 0 &&
    isHighMortality(hensDied, selectedLot.liveHenCount);

  return (
    <View className="space-y-4">
      {/* Lot Selector */}
      <View>
        <Text className="text-gray-700 font-medium mb-2">Lote *</Text>
        <Controller
          control={control}
          name="lotId"
          render={({ field: { onChange, value } }) => (
            <View className="border border-gray-300 rounded-lg bg-white">
              {lots.filter((l) => l.liveHenCount > 0).length === 0 ? (
                <Text className="p-4 text-gray-500 text-center">
                  No hay lotes activos disponibles
                </Text>
              ) : (
                lots
                  .filter((l) => l.liveHenCount > 0)
                  .map((lot) => (
                    <Pressable
                      key={lot.id}
                      onPress={() => onChange(lot.id)}
                      className={`p-3 border-b border-gray-200 ${value === lot.id ? 'bg-blue-50' : ''}`}
                    >
                      <Text
                        className={`font-medium ${value === lot.id ? 'text-blue-600' : 'text-gray-900'}`}
                      >
                        {lot.name}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {lot.liveHenCount} gallinas vivas
                      </Text>
                    </Pressable>
                  ))
              )}
            </View>
          )}
        />
        {errors.lotId && (
          <Text className="text-red-600 text-sm mt-1">
            {errors.lotId.message}
          </Text>
        )}
      </View>

      {/* Date */}
      <View>
        <Text className="text-gray-700 font-medium mb-2">Fecha *</Text>
        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, value } }) => (
            <DatePicker
              value={value}
              onChange={onChange}
              error={errors.date?.message}
              maxDate={new Date()}
            />
          )}
        />
      </View>

      {/* Hens Died */}
      <View>
        <Text className="text-gray-700 font-medium mb-2">
          Gallinas Muertas *
        </Text>
        <Controller
          control={control}
          name="hensDied"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              value={value.toString()}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                onChange(num);
              }}
              onBlur={onBlur}
              placeholder="Cantidad"
              error={errors.hensDied?.message}
              keyboardType="numeric"
            />
          )}
        />
        {selectedLot && (
          <Text className="text-sm text-gray-500 mt-1">
            Gallinas vivas: {selectedLot.liveHenCount}
          </Text>
        )}
      </View>

      {/* High Mortality Warning */}
      {showHighMortalityWarning && (
        <View className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <Text className="text-amber-800 font-medium">
            ⚠️ Alta Mortalidad
          </Text>
          <Text className="text-amber-700 text-sm mt-1">
            La mortalidad supera el 10%. Este evento será registrado en la
            auditoría.
          </Text>
        </View>
      )}

      <Button
        onPress={handleSubmit(handleFormSubmit)}
        disabled={isSubmitting || lots.filter((l) => l.liveHenCount > 0).length === 0}
        className="mt-4"
      >
        {isSubmitting ? 'Registrando...' : submitLabel}
      </Button>
    </View>
  );
};
