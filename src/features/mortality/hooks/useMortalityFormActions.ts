/**
 * Mortality Form Actions Hook
 *
 * Provides edit handler for mortality forms with loading states and toast notifications.
 * Note: Only hensDied can be updated - date and lot are immutable after creation.
 */

import { useState } from 'react';
import { MortalityServiceProvider } from '../services/MortalityServiceProvider';

interface UseMortalityFormActionsProps {
  onSuccess?: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export function useMortalityFormActions({
  onSuccess,
  showToast,
}: UseMortalityFormActionsProps) {
  const [formLoading, setFormLoading] = useState(false);

  const handleEditMortality = async (recordId: string, hensDied: number) => {
    setFormLoading(true);
    try {
      const service = await MortalityServiceProvider.getMortalityService();
      const result = await service.updateMortality(recordId, hensDied);

      if (result.success) {
        showToast('Mortalidad actualizada correctamente', 'success');
        onSuccess?.();
      } else {
        showToast(result.error || 'Error al actualizar mortalidad', 'error');
      }
    } catch (error) {
      showToast('Error al actualizar la mortalidad', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return {
    formLoading,
    handleEditMortality,
  };
}
