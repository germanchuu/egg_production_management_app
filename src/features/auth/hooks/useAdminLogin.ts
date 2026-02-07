/**
 * useAdminLogin Hook
 *
 * Custom hook for admin login functionality using access code.
 * Handles login logic, loading state, and error handling.
 * Follows separation of concerns - business logic separate from UI.
 */

import { useState, useCallback } from 'react';
import { AuthService } from '@/features/auth/services/AuthService';
import { firestore } from '@/core/config/firebase';
import * as Device from 'expo-device';

interface UseAdminLoginReturn {
  isLoading: boolean;
  error: string | null;
  loginAdmin: (accessCode: string) => Promise<{ success: boolean }>;
}

/**
 * Hook for admin login from Firestore using access code
 *
 * @returns Login function, loading state, and error message
 */
export function useAdminLogin(): UseAdminLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Login admin user with access code
   *
   * @param accessCode - User's access code (Firestore document ID)
   */
  const loginAdmin = useCallback(
    async (accessCode: string): Promise<{ success: boolean }> => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate input
        if (!accessCode.trim()) {
          setError('Por favor ingresa el código de acceso');
          return { success: false };
        }

        // Get device name
        const deviceName = Device.deviceName || Device.modelName || 'Dispositivo';

        // Call auth service
        const result = await AuthService.loginAdminFromFirestore(
          accessCode.trim(),
          deviceName,
          firestore
        );

        if (!result.success) {
          setError(result.error || 'Error al iniciar sesión');
          return { success: false };
        }

        return { success: true };
      } catch (err) {
        const errorMessage =
          'Error inesperado al iniciar sesión. Por favor intenta de nuevo.';
        setError(errorMessage);
        console.error('Error in useAdminLogin:', err);
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    loginAdmin,
  };
}
