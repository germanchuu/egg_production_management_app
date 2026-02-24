/**
 * MortalityEditForm Component
 *
 * Form for editing mortality record (hens died only).
 * Date and lot are displayed as read-only.
 */

import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { FormInput } from '@/shared/components/FormInput';
import { Button } from '@/shared/components/Button';
import { MortalityRecord, ChickenLot } from '@/shared/types/entities';

interface MortalityEditFormProps {
  record: MortalityRecord;
  lot: ChickenLot;
  onSubmit: (hensDied: number) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const MortalityEditForm: React.FC<MortalityEditFormProps> = ({
  record,
  lot,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [hensDied, setHensDied] = useState(record.hensDied.toString());
  const [error, setError] = useState<string>('');

  const handleSubmit = () => {
    const hens = parseInt(hensDied);

    if (isNaN(hens) || hens <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    // Calculate what the new live count would be
    const difference = record.hensDied - hens;
    const newLiveCount = lot.liveHenCount + difference;

    if (newLiveCount < 0) {
      setError(
        `No se puede actualizar: excede el número de gallinas vivas (${lot.liveHenCount})`
      );
      return;
    }

    if (newLiveCount > lot.initialHenCount) {
      setError('No se puede actualizar: excede el número inicial de gallinas');
      return;
    }

    setError('');
    onSubmit(hens);
  };

  // Calculate projected new live count
  const difference = record.hensDied - parseInt(hensDied || '0');
  const projectedLiveCount = lot.liveHenCount + difference;

  return (
    <View className="space-y-4">
      {/* Editable field */}
      <FormInput
        label="Gallinas Muertas"
        value={hensDied}
        onChangeText={(text) => {
          setHensDied(text);
          setError('');
        }}
        placeholder="Cantidad"
        error={error}
        helpText={`Gallinas vivas actuales: ${lot.liveHenCount} → Proyectado: ${projectedLiveCount}`}
        keyboardType="numeric"
        required
      />

      {/* Read-only section */}
      <View className="mt-sm border-t border-gray-200 pt-lg">
        <Text className="text-base font-semibold text-textPrimary mb-md">
          Información del registro
        </Text>

        <View className="gap-lg">
          <View>
            <Text className="text-xs text-textTertiary mb-xs">Lote</Text>
            <Text className="text-base text-textSecondary">{lot.name}</Text>
          </View>

          <View>
            <Text className="text-xs text-textTertiary mb-xs">Fecha</Text>
            <Text className="text-base text-textSecondary">
              {new Date(record.date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>

          <View>
            <Text className="text-xs text-textTertiary mb-xs">
              Registrado a las
            </Text>
            <Text className="text-base text-textSecondary">
              {new Date(record.createdAt).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View>
            <Text className="text-xs text-textTertiary mb-xs">
              Valor original
            </Text>
            <Text className="text-base text-textSecondary">
              {record.hensDied} gallina{record.hensDied !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Spacer */}
      <View className="h-xl" />

      {/* Action Buttons */}
      <View className="flex-row gap-md">
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
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </View>
      </View>
    </View>
  );
};
