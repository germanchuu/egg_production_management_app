/**
 * ProductionEntryForm Component
 *
 * Form for recording daily egg production.
 * Uses react-hook-form with Zod validation.
 * Includes smart defaults (recent lot, today's date).
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  productionRecordSchema,
  ProductionRecordFormData,
  validateLotHasLiveHens,
  needsSanityCheckWarning,
  getSanityCheckWarningMessage,
  getProductionStatus,
} from '../utils/validation';
import { FormInput } from '@/shared/components/FormInput';
import { DatePicker } from '@/shared/components/DatePicker';
import { SelectPicker } from '@/shared/components/SelectPicker';
import { Button } from '@/shared/components/Button';
import { ChickenLot } from '@/shared/types/entities';
import { theme } from '@/core/theme';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react-native';

interface ProductionEntryFormProps {
  lots: ChickenLot[];
  onSubmit: (data: ProductionRecordFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  defaultLotId?: string | null;
}

export const ProductionEntryForm: React.FC<ProductionEntryFormProps> = ({
  lots,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Registrar',
  defaultLotId,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    reset,
  } = useForm<ProductionRecordFormData>({
    resolver: zodResolver(productionRecordSchema),
    defaultValues: {
      lotId: defaultLotId || lots.filter((l) => l.liveHenCount > 0)[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      eggsCollected: 0,
    },
  });

  const selectedLotId = watch('lotId');
  const eggsCollected = watch('eggsCollected');
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

  const handleFormSubmit = (data: ProductionRecordFormData) => {
    if (!selectedLot) {
      setError('lotId', { message: 'Debe seleccionar un lote' });
      return;
    }

    // Validate lot has live hens
    const validation = validateLotHasLiveHens(selectedLot.liveHenCount);
    if (!validation.valid) {
      setError('lotId', { message: validation.error });
      return;
    }

    onSubmit(data);
  };

  const handleCancel = () => {
    reset();
    onCancel?.();
  };

  // Get production status
  const productionStatus =
    selectedLot && eggsCollected > 0
      ? getProductionStatus(eggsCollected, selectedLot.liveHenCount)
      : null;

  // Check if sanity warning is needed
  const showSanityWarning =
    selectedLot &&
    eggsCollected > 0 &&
    needsSanityCheckWarning(eggsCollected, selectedLot.liveHenCount);

  return (
    <View className="space-y-4">
      {/* Lot Selector */}
      {lotOptions.length === 0 ? (
        <View className="bg-amber-50 border border-amber-200 rounded-md p-lg">
          <Text className="text-amber-800 font-medium text-center">
            No hay lotes activos disponibles
          </Text>
          <Text className="text-amber-700 text-sm text-center mt-1">
            Debes crear un lote con gallinas vivas para registrar producción
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

      {/* Eggs Collected */}
      <Controller
        control={control}
        name="eggsCollected"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Huevos Recolectados"
            value={value.toString()}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              onChange(num);
            }}
            onBlur={onBlur}
            placeholder="Cantidad"
            error={errors.eggsCollected?.message}
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

      {/* Production Status Indicator */}
      {productionStatus && !showSanityWarning && (
        <View
          className={`rounded-md p-md flex-row items-center gap-sm ${
            productionStatus.status === 'optimal'
              ? 'bg-success/10 border border-success/20'
              : productionStatus.status === 'low'
                ? 'bg-warning/10 border border-warning/20'
                : 'bg-gray-50 border border-gray-200'
          }`}
        >
          {productionStatus.status === 'optimal' ? (
            <TrendingUp size={20} color={theme.colors.success.DEFAULT} />
          ) : productionStatus.status === 'low' ? (
            <TrendingDown size={20} color={theme.colors.warning.DEFAULT} />
          ) : null}
          <Text
            className={`flex-1 text-sm font-medium ${
              productionStatus.status === 'optimal'
                ? 'text-success'
                : productionStatus.status === 'low'
                  ? 'text-warning'
                  : 'text-textSecondary'
            }`}
          >
            {productionStatus.message}
          </Text>
        </View>
      )}

      {/* Sanity Check Warning */}
      {showSanityWarning && selectedLot && (
        <View className="bg-amber-50 border border-amber-200 rounded-md p-md">
          <View className="flex-row items-start gap-sm">
            <AlertTriangle size={20} color={theme.colors.warning.DEFAULT} />
            <Text className="flex-1 text-amber-800 text-sm">
              {getSanityCheckWarningMessage(
                eggsCollected,
                selectedLot.liveHenCount
              )}
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row gap-md mt-md">
        <View className="flex-1">
          <Button
            variant="secondary"
            onPress={handleCancel}
            disabled={isSubmitting}
          >
            Limpiar
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
    </View>
  );
};
