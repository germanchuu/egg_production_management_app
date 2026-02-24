/**
 * FeedBatchForm Component (T124)
 *
 * Form for registering a new feed batch.
 * Uses react-hook-form + Zod validation.
 * Inputs: batch name, preparation date, quantity (decimal, 2 places).
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package, Scale } from 'lucide-react-native';
import {
  feedBatchSchema,
  FeedBatchFormData,
} from '../utils/validation';
import { FormInput } from '@/shared/components/FormInput';
import { DatePicker } from '@/shared/components/DatePicker';
import { Button } from '@/shared/components/Button';
import { theme } from '@/core/theme';

interface FeedBatchFormProps {
  onSubmit: (data: FeedBatchFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export const FeedBatchForm: React.FC<FeedBatchFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Registrar Lote',
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FeedBatchFormData>({
    resolver: zodResolver(feedBatchSchema),
    defaultValues: {
      batchName: '',
      preparationDate: new Date().toISOString().split('T')[0],
      quantityKg: 0,
    },
  });

  const quantityKg = watch('quantityKg');

  const handleCancel = () => {
    reset();
    onCancel?.();
  };

  return (
    <View className="gap-lg">
      {/* Batch Name */}
      <Controller
        control={control}
        name="batchName"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Nombre del Lote de Alimento"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ej: Lote Enero Semana 1"
            error={errors.batchName?.message}
            disabled={isSubmitting}
            required
          />
        )}
      />

      {/* Preparation Date */}
      <Controller
        control={control}
        name="preparationDate"
        render={({ field: { onChange, value } }) => (
          <DatePicker
            label="Fecha de Preparación"
            value={new Date(value)}
            onChange={(date) => onChange(date.toISOString().split('T')[0])}
            error={errors.preparationDate?.message}
            maxDate={new Date()}
            required
          />
        )}
      />

      {/* Quantity */}
      <Controller
        control={control}
        name="quantityKg"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Cantidad Total (kg)"
            value={value > 0 ? value.toString() : ''}
            onChangeText={(text) => {
              const num = parseFloat(text.replace(',', '.')) || 0;
              onChange(Math.round(num * 100) / 100);
            }}
            onBlur={onBlur}
            placeholder="0.00"
            error={errors.quantityKg?.message}
            keyboardType="decimal-pad"
            helpText="Ingrese la cantidad en kilogramos (decimales permitidos)"
            disabled={isSubmitting}
            required
          />
        )}
      />

      {/* Quantity summary badge */}
      {quantityKg > 0 && (
        <View className="bg-primary-50 border border-primary-100 rounded-md p-md flex-row items-center gap-sm">
          <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center">
            <Scale size={16} color={theme.colors.primary['600']} />
          </View>
          <Text className="text-sm text-primary-700 font-medium">
            {quantityKg.toFixed(2)} kg disponibles al registrar
          </Text>
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
            icon={Package}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registrando...' : submitLabel}
          </Button>
        </View>
      </View>
    </View>
  );
};
