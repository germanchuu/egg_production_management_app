/**
 * LotForm Component
 *
 * Form for creating chicken lots.
 * Uses react-hook-form with Zod validation.
 */

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { chickenLotSchema, ChickenLotFormData } from '../utils/validation';
import { FormInput } from '@/shared/components/FormInput';
import { DatePicker } from '@/shared/components/DatePicker';
import { SelectPicker } from '@/shared/components/SelectPicker';
import { Button } from '@/shared/components/Button';
import { ChickenHouse } from '@/shared/types/entities';

interface LotFormProps {
  houses: ChickenHouse[];
  onSubmit: (data: ChickenLotFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export const LotForm: React.FC<LotFormProps> = ({
  houses,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Crear Lote',
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ChickenLotFormData>({
    resolver: zodResolver(chickenLotSchema),
    defaultValues: {
      name: '',
      chickenHouseId: houses[0]?.id || '',
      purchaseDate: new Date().toISOString().split('T')[0],
      initialHenCount: 0,
      ageWeeks: 0,
    },
  });

  // Transform houses to SelectPicker options
  const houseOptions = useMemo(
    () =>
      houses.map((house) => ({
        label: house.name,
        value: house.id,
      })),
    [houses]
  );

  return (
    <View className="space-y-4">
      {/* Lot Name */}
      <View>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Nombre del Lote"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ej: Lote Marzo 2024"
              error={errors.name?.message}
              required
              autoCapitalize="words"
              maxLength={100}
            />
          )}
        />
      </View>

      {/* House Selector */}
      <Controller
        control={control}
        name="chickenHouseId"
        render={({ field: { onChange, value } }) => (
          <SelectPicker
            label="Galpón"
            value={value}
            onChange={onChange}
            options={houseOptions}
            error={errors.chickenHouseId?.message}
            disabled={isSubmitting}
            required
            placeholder="Selecciona un galpón"
          />
        )}
      />

      {/* Purchase Date */}
      <View>
        <Controller
          control={control}
          name="purchaseDate"
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label="Fecha de Compra"
              value={new Date(value)}
              onChange={(date) => {
                // Convert Date to string (YYYY-MM-DD) for schema validation
                onChange(date.toISOString().split('T')[0]);
              }}
              error={errors.purchaseDate?.message}
              maxDate={new Date()}
              required
            />
          )}
        />
      </View>

      {/* Initial Hen Count */}
      <View>
        <Controller
          control={control}
          name="initialHenCount"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Cantidad Inicial de Gallinas"
              value={value.toString()}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                onChange(num);
              }}
              onBlur={onBlur}
              placeholder="Ej: 500"
              error={errors.initialHenCount?.message}
              required
              keyboardType="numeric"
            />
          )}
        />
      </View>

      {/* Age in Weeks */}
      <View>
        <Controller
          control={control}
          name="ageWeeks"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Edad en Semanas"
              value={value.toString()}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                onChange(num);
              }}
              onBlur={onBlur}
              placeholder="Ej: 18"
              error={errors.ageWeeks?.message}
              required
              keyboardType="numeric"
            />
          )}
        />
      </View>

      {/* Action Buttons */}
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
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creando...' : submitLabel}
          </Button>
        </View>
      </View>
    </View>
  );
};
