/**
 * FeedingForm Component (T125)
 *
 * Form for recording a daily feeding event for a lot.
 * Inputs: lot selector, feed batch selector, date picker, quantity fed (decimal).
 * Shows warning (non-blocking) if quantity exceeds batch remaining (T123).
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Wheat, Scale } from 'lucide-react-native';
import {
  feedingRecordSchema,
  FeedingRecordFormData,
  validateFeedingQuantityVsRemaining,
  validateLotHasLiveHens,
} from '../utils/validation';
import { FormInput } from '@/shared/components/FormInput';
import { DatePicker } from '@/shared/components/DatePicker';
import { SelectPicker } from '@/shared/components/SelectPicker';
import { Button } from '@/shared/components/Button';
import { ChickenLot } from '@/shared/types/entities';
import { FeedBatchWithRemaining } from '../services/FeedingService';
import { theme } from '@/core/theme';

interface FeedingFormProps {
  lots: ChickenLot[];
  feedBatches: FeedBatchWithRemaining[];
  onSubmit: (data: FeedingRecordFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  defaultLotId?: string | null;
}

export const FeedingForm: React.FC<FeedingFormProps> = ({
  lots,
  feedBatches,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Registrar Alimentación',
  defaultLotId,
}) => {
  const activeLots = useMemo(
    () => lots.filter((l) => l.liveHenCount > 0),
    [lots]
  );

  const availableBatches = useMemo(
    () => feedBatches.filter((b) => b.remainingQuantityKg > 0),
    [feedBatches]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    reset,
  } = useForm<FeedingRecordFormData>({
    resolver: zodResolver(feedingRecordSchema),
    defaultValues: {
      lotId: defaultLotId || activeLots[0]?.id || '',
      feedBatchId: availableBatches[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      quantityFedKg: 0,
    },
  });

  const selectedLotId = watch('lotId');
  const selectedBatchId = watch('feedBatchId');
  const quantityFedKg = watch('quantityFedKg');

  const selectedLot = lots.find((l) => l.id === selectedLotId);
  const selectedBatch = feedBatches.find((b) => b.id === selectedBatchId);

  // Build selectors
  const lotOptions = useMemo(
    () =>
      activeLots.map((lot) => ({
        label: `${lot.name} (${lot.liveHenCount} vivas)`,
        value: lot.id,
      })),
    [activeLots]
  );

  const batchOptions = useMemo(
    () =>
      availableBatches.map((b) => ({
        label: `${b.batchName} (${b.remainingQuantityKg.toFixed(2)} kg disp.)`,
        value: b.id,
      })),
    [availableBatches]
  );

  // Detect warning: quantity exceeds remaining
  const exceedsWarning =
    selectedBatch && quantityFedKg > 0
      ? validateFeedingQuantityVsRemaining(
          quantityFedKg,
          selectedBatch.remainingQuantityKg
        )
      : null;

  const handleFormSubmit = (data: FeedingRecordFormData) => {
    // Validate lot still has live hens (runtime check)
    if (selectedLot) {
      const lotCheck = validateLotHasLiveHens(selectedLot.liveHenCount);
      if (!lotCheck.valid) {
        setError('lotId', { message: lotCheck.error });
        return;
      }
    }

    onSubmit(data);
  };

  const handleCancel = () => {
    reset();
    onCancel?.();
  };

  // Feed per hen preview
  const feedPerHenPreview =
    selectedLot && quantityFedKg > 0 && selectedLot.liveHenCount > 0
      ? (quantityFedKg / selectedLot.liveHenCount).toFixed(4)
      : null;

  return (
    <View className="gap-lg">
      {/* No active lots warning */}
      {activeLots.length === 0 && (
        <View className="bg-amber-50 border border-amber-200 rounded-md p-lg">
          <Text className="text-amber-800 font-medium text-center">
            No hay lotes activos disponibles
          </Text>
          <Text className="text-amber-700 text-sm text-center mt-xs">
            Debes tener un lote con gallinas vivas para registrar alimentación
          </Text>
        </View>
      )}

      {/* No available batches warning */}
      {availableBatches.length === 0 && (
        <View className="bg-amber-50 border border-amber-200 rounded-md p-lg">
          <Text className="text-amber-800 font-medium text-center">
            No hay lotes de alimento disponibles
          </Text>
          <Text className="text-amber-700 text-sm text-center mt-xs">
            Registra un lote de alimento con cantidad disponible primero
          </Text>
        </View>
      )}

      {/* Lot Selector */}
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
            disabled={isSubmitting || activeLots.length === 0}
            required
            placeholder="Selecciona un lote"
          />
        )}
      />

      {/* Feed Batch Selector */}
      <Controller
        control={control}
        name="feedBatchId"
        render={({ field: { onChange, value } }) => (
          <SelectPicker
            label="Lote de Alimento"
            value={value}
            onChange={onChange}
            options={batchOptions}
            error={errors.feedBatchId?.message}
            disabled={isSubmitting || availableBatches.length === 0}
            required
            placeholder="Selecciona un lote de alimento"
          />
        )}
      />

      {/* Batch remaining info */}
      {selectedBatch && (
        <View className="bg-gray-50 border border-gray-200 rounded-md p-md flex-row items-center gap-sm">
          <Scale size={16} color={theme.colors.gray['500']} />
          <Text className="text-sm text-textSecondary">
            Disponible en el lote:{' '}
            <Text className="font-medium text-textPrimary">
              {selectedBatch.remainingQuantityKg.toFixed(2)} kg
            </Text>
          </Text>
        </View>
      )}

      {/* Date */}
      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, value } }) => (
          <DatePicker
            label="Fecha"
            value={new Date(value)}
            onChange={(date) => onChange(date.toISOString().split('T')[0])}
            error={errors.date?.message}
            maxDate={new Date()}
            required
          />
        )}
      />

      {/* Quantity Fed */}
      <Controller
        control={control}
        name="quantityFedKg"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Cantidad Suministrada (kg)"
            value={value > 0 ? value.toString() : ''}
            onChangeText={(text) => {
              const num = parseFloat(text.replace(',', '.')) || 0;
              onChange(Math.round(num * 100) / 100);
            }}
            onBlur={onBlur}
            placeholder="0.00"
            error={errors.quantityFedKg?.message}
            keyboardType="decimal-pad"
            helpText={
              selectedLot
                ? `Gallinas en el lote: ${selectedLot.liveHenCount}`
                : undefined
            }
            disabled={isSubmitting}
            required
          />
        )}
      />

      {/* Feed per hen preview */}
      {feedPerHenPreview && !exceedsWarning?.warning && (
        <View className="bg-primary-50 border border-primary-100 rounded-md p-md flex-row items-center gap-sm">
          <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center">
            <Wheat size={16} color={theme.colors.primary['600']} />
          </View>
          <Text className="text-sm text-primary-700">
            Estimado:{' '}
            <Text className="font-semibold">{feedPerHenPreview} kg/gallina</Text>
          </Text>
        </View>
      )}

      {/* Exceeds remaining warning (non-blocking, T123) */}
      {exceedsWarning?.warning && (
        <View className="bg-amber-50 border border-amber-200 rounded-md p-md">
          <View className="flex-row items-start gap-sm">
            <AlertTriangle size={20} color={theme.colors.warning.DEFAULT} />
            <Text className="flex-1 text-amber-800 text-sm">
              {exceedsWarning.warning}
            </Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View className="flex-row gap-md mt-sm">
        {onCancel && (
          <View className="flex-1">
            <Button variant="secondary" onPress={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          </View>
        )}
        <View className="flex-1">
          <Button
            variant="primary"
            icon={Wheat}
            onPress={handleSubmit(handleFormSubmit)}
            loading={isSubmitting}
            disabled={
              isSubmitting ||
              activeLots.length === 0 ||
              availableBatches.length === 0
            }
          >
            {isSubmitting ? 'Registrando...' : submitLabel}
          </Button>
        </View>
      </View>
    </View>
  );
};
