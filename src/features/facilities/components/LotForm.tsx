/**
 * LotForm Component
 *
 * Form for creating chicken lots.
 * Uses react-hook-form with Zod validation.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { chickenLotSchema, ChickenLotFormData } from '../utils/validation';
import { FormInput } from '@/shared/components/FormInput';
import { DatePicker } from '@/shared/components/DatePicker';
import { Button } from '@/shared/components/Button';
import { ChickenHouse } from '@/shared/types/entities';

interface LotFormProps {
  houses: ChickenHouse[];
  onSubmit: (data: ChickenLotFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export const LotForm: React.FC<LotFormProps> = ({
  houses,
  onSubmit,
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

  return (
    <View className="space-y-4">
      {/* Lot Name */}
      <View>
        <Text className="text-gray-700 font-medium mb-2">Nombre del Lote *</Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ej: Lote Marzo 2024"
              error={errors.name?.message}
              autoCapitalize="words"
              maxLength={100}
            />
          )}
        />
      </View>

      {/* House Selector */}
      <View>
        <Text className="text-gray-700 font-medium mb-2">Galpón *</Text>
        <Controller
          control={control}
          name="chickenHouseId"
          render={({ field: { onChange, value } }) => (
            <View className="border border-gray-300 rounded-lg p-3 bg-white">
              {houses.map((house) => (
                <Text
                  key={house.id}
                  onPress={() => onChange(house.id)}
                  className={`py-2 ${value === house.id ? 'font-bold text-blue-600' : 'text-gray-700'}`}
                >
                  {house.name}
                </Text>
              ))}
            </View>
          )}
        />
        {errors.chickenHouseId && (
          <Text className="text-red-600 text-sm mt-1">
            {errors.chickenHouseId.message}
          </Text>
        )}
      </View>

      {/* Purchase Date */}
      <View>
        <Text className="text-gray-700 font-medium mb-2">Fecha de Compra *</Text>
        <Controller
          control={control}
          name="purchaseDate"
          render={({ field: { onChange, value } }) => (
            <DatePicker
              value={value}
              onChange={onChange}
              error={errors.purchaseDate?.message}
              maxDate={new Date()}
            />
          )}
        />
      </View>

      {/* Initial Hen Count */}
      <View>
        <Text className="text-gray-700 font-medium mb-2">
          Cantidad Inicial de Gallinas *
        </Text>
        <Controller
          control={control}
          name="initialHenCount"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              value={value.toString()}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                onChange(num);
              }}
              onBlur={onBlur}
              placeholder="Ej: 500"
              error={errors.initialHenCount?.message}
              keyboardType="numeric"
            />
          )}
        />
      </View>

      {/* Age in Weeks */}
      <View>
        <Text className="text-gray-700 font-medium mb-2">
          Edad en Semanas *
        </Text>
        <Controller
          control={control}
          name="ageWeeks"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              value={value.toString()}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                onChange(num);
              }}
              onBlur={onBlur}
              placeholder="Ej: 18"
              error={errors.ageWeeks?.message}
              keyboardType="numeric"
            />
          )}
        />
      </View>

      <Button
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        className="mt-4"
      >
        {isSubmitting ? 'Creando...' : submitLabel}
      </Button>
    </View>
  );
};
