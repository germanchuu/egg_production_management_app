/**
 * MortalityForm Component
 *
 * Form for recording mortality events.
 * Uses react-hook-form with Zod validation.
 * Validates hensDied against lot's current liveHenCount.
 */

import React, { useMemo } from 'react';
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
import { SelectPicker } from '@/shared/components/SelectPicker';
import { Button } from '@/shared/components/Button';
import { ChickenLot } from '@/shared/types/entities';

interface MortalityFormProps {
  lots: ChickenLot[];
  onSubmit: (data: MortalityRecordFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export const MortalityForm: React.FC<MortalityFormProps> = ({
  lots,
  onSubmit,
  onCancel,
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

  // Transform active lots to SelectPicker options
  const lotOptions = useMemo(
    () =>
      lots
        .filter((l) => l.liveHenCount > 0)
        .map((lot) => ({
          label: `${lot.name} (${lot.liveHenCount} vivas)`,
          value: lot.id,
        })),
    [lots]
  );

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
      {lotOptions.length === 0 ? (
        <View className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <Text className="text-amber-800 font-medium text-center">
            No hay lotes activos disponibles
          </Text>
          <Text className="text-amber-700 text-sm text-center mt-1">
            Debes crear un lote con gallinas vivas para registrar mortalidad
          </Text>
        </View>
      ) : (
        <Controller
          control={control}
          name="lotId"
          render={({ field: { onChange, value } }) => (
            <SelectPicker
              label="Lote"
              value={value}
              onChange={onChange}
              options={lotOptions}
              error={errors.lotId?.message}
              disabled={isSubmitting}
              required
              placeholder="Selecciona un lote"
            />
          )}
        />
      )}

      {/* Date */}
      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, value } }) => (
          <DatePicker
            label="Fecha"
            value={new Date(value)}
            onChange={(date) => {
              // Convert Date to string (YYYY-MM-DD) for schema validation
              onChange(date.toISOString().split('T')[0]);
            }}
            error={errors.date?.message}
            maxDate={new Date()}
            required
          />
        )}
      />

      {/* Hens Died */}
      <Controller
        control={control}
        name="hensDied"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Gallinas Muertas"
            value={value.toString()}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              onChange(num);
            }}
            onBlur={onBlur}
            placeholder="Cantidad"
            error={errors.hensDied?.message}
            helpText={
              selectedLot
                ? `Gallinas vivas: ${selectedLot.liveHenCount}`
                : undefined
            }
            keyboardType="numeric"
            required
          />
        )}
      />

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

      {/* Action Buttons */}
      {onCancel ? (
        <View className="flex-row gap-md mt-md">
          <View className="flex-1">
            <Button
              variant="secondary"
              onPress={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </View>
          <View className="flex-1">
            <Button
              variant="primary"
              onPress={handleSubmit(handleFormSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting || lotOptions.length === 0}
            >
              {isSubmitting ? 'Registrando...' : submitLabel}
            </Button>
          </View>
        </View>
      ) : (
        <Button
          variant="primary"
          onPress={handleSubmit(handleFormSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting || lotOptions.length === 0}
          className="mt-md"
        >
          {isSubmitting ? 'Registrando...' : submitLabel}
        </Button>
      )}
    </View>
  );
};
