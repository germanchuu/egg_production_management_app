/**
 * ProductionEditForm Component
 *
 * Form for editing production record (eggs collected only).
 * Date and lot are displayed as read-only.
 */

import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { FormInput } from '@/shared/components/FormInput';
import { Button } from '@/shared/components/Button';
import { ProductionRecord, ChickenLot } from '@/shared/types/entities';

interface ProductionEditFormProps {
  record: ProductionRecord;
  lot: ChickenLot;
  onSubmit: (eggsCollected: number) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const ProductionEditForm: React.FC<ProductionEditFormProps> = ({
  record,
  lot,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [eggsCollected, setEggsCollected] = useState(
    record.eggsCollected.toString()
  );
  const [error, setError] = useState<string>('');

  const handleSubmit = () => {
    const eggs = parseInt(eggsCollected);

    if (isNaN(eggs) || eggs <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    if (eggs > lot.liveHenCount * 2) {
      setError(
        `La cantidad excede el límite razonable para ${lot.liveHenCount} gallinas`
      );
      return;
    }

    setError('');
    onSubmit(eggs);
  };

  return (
    <View className="space-y-4">
      {/* Editable field */}
      <FormInput
        label="Huevos Recolectados"
        value={eggsCollected}
        onChangeText={(text) => {
          setEggsCollected(text);
          setError('');
        }}
        placeholder="Cantidad"
        error={error}
        helpText={`Gallinas vivas: ${lot.liveHenCount}`}
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
