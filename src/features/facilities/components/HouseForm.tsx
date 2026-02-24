/**
 * HouseForm Component
 *
 * Form for creating/editing chicken houses.
 * Uses react-hook-form with Zod validation.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { chickenHouseSchema, ChickenHouseFormData } from '../utils/validation';
import { FormInput } from '@/shared/components/FormInput';
import { Button } from '@/shared/components/Button';

interface HouseFormProps {
  onSubmit: (data: ChickenHouseFormData) => void;
  onCancel: () => void;
  initialValues?: Partial<ChickenHouseFormData>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export const HouseForm: React.FC<HouseFormProps> = ({
  onSubmit,
  onCancel,
  initialValues,
  isSubmitting = false,
  submitLabel = 'Guardar',
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChickenHouseFormData>({
    resolver: zodResolver(chickenHouseSchema),
    defaultValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || '',
    },
  });

  return (
    <View className="space-y-4">
      <View>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Nombre del Galpón"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ej: Galpón 1"
              error={errors.name?.message}
              required
              autoCapitalize="words"
              maxLength={100}
            />
          )}
        />
      </View>

      <View>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Descripción"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ej: Galpón principal en el sector norte"
              error={errors.description?.message}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          )}
        />
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-md mt-md">
        <View className="flex-1">
          <Button variant="secondary" onPress={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        </View>
        <View className="flex-1">
          <Button
            variant="primary"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : submitLabel}
          </Button>
        </View>
      </View>
    </View>
  );
};
