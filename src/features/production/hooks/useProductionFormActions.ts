/**
 * Production Form Actions Hook
 *
 * Provides edit handler for production forms with loading states and toast notifications.
 * Note: Only eggsCollected can be updated - date and lot are immutable after creation.
 */

import { useState } from 'react';
import { ProductionServiceProvider } from '../services/ProductionServiceProvider';

interface UseProductionFormActionsProps {
  onSuccess?: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export function useProductionFormActions({
  onSuccess,
  showToast,
}: UseProductionFormActionsProps) {
  const [formLoading, setFormLoading] = useState(false);

  const handleEditProduction = async (
    recordId: string,
    eggsCollected: number
  ) => {
    setFormLoading(true);
    try {
      const service = await ProductionServiceProvider.getProductionService();
      const result = await service.updateProduction(recordId, eggsCollected);

      if (result.success) {
        showToast('Producción actualizada correctamente', 'success');
        onSuccess?.();
      } else {
        showToast(result.error || 'Error al actualizar producción', 'error');
      }
    } catch (error) {
      showToast('Error al actualizar la producción', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return {
    formLoading,
    handleEditProduction,
  };
}
