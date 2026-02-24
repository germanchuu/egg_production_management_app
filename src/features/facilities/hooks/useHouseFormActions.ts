/**
 * House Form Actions Hook
 *
 * Provides create and edit handlers for house forms with loading states and toast notifications.
 */

import { useState } from 'react';
import { FacilityServiceProvider } from '../services/FacilityServiceProvider';
import { ChickenHouseFormData } from '../utils/validation';

interface UseHouseFormActionsProps {
  onSuccess?: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export function useHouseFormActions({
  onSuccess,
  showToast,
}: UseHouseFormActionsProps) {
  const [formLoading, setFormLoading] = useState(false);

  const handleCreateHouse = async (
    data: ChickenHouseFormData,
    userId: string
  ) => {
    setFormLoading(true);
    try {
      const service = await FacilityServiceProvider.getFacilityService();
      const result = await service.createHouse(
        data.name,
        data.description,
        userId
      );

      if (result.success) {
        showToast('Galpón creado correctamente', 'success');
        onSuccess?.();
      } else {
        showToast(result.error || 'Error al crear galpón', 'error');
      }
    } catch (error) {
      showToast('Error al crear el galpón', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditHouse = async (
    houseId: string,
    data: ChickenHouseFormData,
    userId: string
  ) => {
    setFormLoading(true);
    try {
      const service = await FacilityServiceProvider.getFacilityService();
      const result = await service.updateHouse(
        houseId,
        data.name,
        data.description,
        userId
      );

      if (result.success) {
        showToast('Galpón actualizado correctamente', 'success');
        onSuccess?.();
      } else {
        showToast(result.error || 'Error al actualizar galpón', 'error');
      }
    } catch (error) {
      showToast('Error al actualizar el galpón', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return {
    formLoading,
    handleCreateHouse,
    handleEditHouse,
  };
}
