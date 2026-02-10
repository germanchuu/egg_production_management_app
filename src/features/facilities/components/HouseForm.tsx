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
  initialValues?: Partial<ChickenHouseFormData>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export const HouseForm: React.FC<HouseFormProps> = ({
  onSubmit,
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
        <Text className="text-gray-700 font-medium mb-2">
          Nombre del Galpón *
        </Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ej: Galpón 1"
              error={errors.name?.message}
              autoCapitalize="words"
              maxLength={100}
            />
          )}
        />
      </View>

      <View>
        <Text className="text-gray-700 font-medium mb-2">
          Descripción (Opcional)
        </Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
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

      <Button
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        className="mt-4"
      >
        {isSubmitting ? 'Guardando...' : submitLabel}
      </Button>
    </View>
  );
};
