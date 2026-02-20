/**
 * BiosecurityEventForm Component (T139)
 *
 * Form for recording a disinfection event at farm level.
 * Fields: date, product name, notes (multi-line). No lot selector.
 */

import React from 'react';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield } from 'lucide-react-native';
import {
  biosecurityEventSchema,
  BiosecurityEventFormData,
} from '../utils/validation';
import { FormInput } from '@/shared/components/FormInput';
import { DatePicker } from '@/shared/components/DatePicker';
import { Button } from '@/shared/components/Button';

interface BiosecurityEventFormProps {
  onSubmit: (data: BiosecurityEventFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const BiosecurityEventForm: React.FC<BiosecurityEventFormProps> = ({
  onSubmit,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BiosecurityEventFormData>({
    resolver: zodResolver(biosecurityEventSchema),
    defaultValues: {
      eventDate: new Date().toISOString().split('T')[0],
      productName: '',
      notes: '',
    },
  });

  const handleFormSubmit = async (data: BiosecurityEventFormData) => {
    await onSubmit(data);
    reset({
      eventDate: new Date().toISOString().split('T')[0],
      productName: '',
      notes: '',
    });
  };

  return (
    <View className="gap-sm">
      {/* Date */}
      <Controller
        control={control}
        name="eventDate"
        render={({ field: { onChange, value } }) => (
          <DatePicker
            label="Fecha del Evento"
            value={new Date(value)}
            onChange={(date) => onChange(date.toISOString().split('T')[0])}
            error={errors.eventDate?.message}
            maxDate={new Date()}
            required
          />
        )}
      />

      {/* Product Name */}
      <Controller
        control={control}
        name="productName"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Nombre del Producto Desinfectante"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ej. Formol, Amonio cuaternario..."
            error={errors.productName?.message}
            disabled={isSubmitting}
            required
          />
        )}
      />

      {/* Notes */}
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Notas (opcional)"
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Áreas desinfectadas, concentración, método..."
            error={errors.notes?.message}
            disabled={isSubmitting}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        )}
      />

      <View className="mt-sm">
        <Button
          variant="primary"
          icon={Shield}
          onPress={handleSubmit(handleFormSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registrando...' : 'Registrar Desinfección'}
        </Button>
      </View>
    </View>
  );
};
