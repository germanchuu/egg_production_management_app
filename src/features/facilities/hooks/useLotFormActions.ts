/**
 * Lot Form Actions Hook
 *
 * Provides create and edit handlers for lot forms with loading states and toast notifications.
 * Note: Lots can only update their name - other fields are immutable after creation.
 */

import { useState } from 'react';
import { FacilityServiceProvider } from '../services/FacilityServiceProvider';
import { ChickenLotFormData } from '../utils/validation';

interface UseLotFormActionsProps {
  onSuccess?: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export function useLotFormActions({
  onSuccess,
  showToast,
}: UseLotFormActionsProps) {
  const [formLoading, setFormLoading] = useState(false);

  const handleCreateLot = async (
    data: ChickenLotFormData,
    userId: string
  ) => {
    setFormLoading(true);
    try {
      const service = await FacilityServiceProvider.getFacilityService();
      const result = await service.createLot(
        data.name,
        data.chickenHouseId,
        data.purchaseDate,
        data.initialHenCount,
        data.ageWeeks,
        userId
      );

      if (result.success) {
        showToast('Lote creado correctamente', 'success');
        onSuccess?.();
      } else {
        showToast(result.error || 'Error al crear lote', 'error');
      }
    } catch (error) {
      showToast('Error al crear el lote', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditLot = async (
    lotId: string,
    data: ChickenLotFormData,
    userId: string
  ) => {
    setFormLoading(true);
    try {
      const service = await FacilityServiceProvider.getFacilityService();
      // Note: Only name can be updated - other fields are immutable
      const result = await service.updateLot(lotId, data.name, userId);

      if (result.success) {
        showToast('Lote actualizado correctamente', 'success');
        onSuccess?.();
      } else {
        showToast(result.error || 'Error al actualizar lote', 'error');
      }
    } catch (error) {
      showToast('Error al actualizar el lote', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return {
    formLoading,
    handleCreateLot,
    handleEditLot,
  };
}
