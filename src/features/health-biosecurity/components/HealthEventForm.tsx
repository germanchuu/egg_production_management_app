/**
 * HealthEventForm Component (T138)
 *
 * Form for recording a vaccination event for a lot.
 * Fields: lot selector, date, product name, notes (multi-line).
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Syringe } from 'lucide-react-native';
import { healthEventSchema, HealthEventFormData } from '../utils/validation';
import { FormInput } from '@/shared/components/FormInput';
import { DatePicker } from '@/shared/components/DatePicker';
import { SelectPicker } from '@/shared/components/SelectPicker';
import { Button } from '@/shared/components/Button';
import { ChickenLot } from '@/shared/types/entities';

interface HealthEventFormProps {
  lots: ChickenLot[];
  onSubmit: (data: HealthEventFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const HealthEventForm: React.FC<HealthEventFormProps> = ({
  lots,
  onSubmit,
  isSubmitting = false,
}) => {
  const activeLots = useMemo(() => lots.filter((l) => l.liveHenCount > 0), [lots]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HealthEventFormData>({
    resolver: zodResolver(healthEventSchema),
    defaultValues: {
      lotId: activeLots[0]?.id || '',
      eventDate: new Date().toISOString().split('T')[0],
      productName: '',
      notes: '',
    },
  });

  const lotOptions = useMemo(
    () =>
      activeLots.map((lot) => ({
        label: `${lot.name} (${lot.liveHenCount} vivas)`,
        value: lot.id,
      })),
    [activeLots]
  );

  const handleFormSubmit = async (data: HealthEventFormData) => {
    await onSubmit(data);
    reset({
      lotId: activeLots[0]?.id || '',
      eventDate: new Date().toISOString().split('T')[0],
      productName: '',
      notes: '',
    });
  };

  return (
    <View className="gap-sm">
      {activeLots.length === 0 && (
        <View className="bg-amber-50 border border-amber-200 rounded-md p-lg">
          <Text className="text-amber-800 font-medium text-center">
            No hay lotes activos disponibles
          </Text>
          <Text className="text-amber-700 text-sm text-center mt-xs">
            Debes tener un lote con gallinas vivas para registrar una vacunación
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
            label="Nombre de la Vacuna / Producto"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ej. Newcastle, Marek, Gumboro..."
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
            placeholder="Observaciones, dosis, lote del producto..."
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
          icon={Syringe}
          onPress={handleSubmit(handleFormSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting || activeLots.length === 0}
        >
          {isSubmitting ? 'Registrando...' : 'Registrar Vacunación'}
        </Button>
      </View>
    </View>
  );
};
