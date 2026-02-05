/**
 * useToast Hook
 *
 * Hook for showing toast notifications easily
 */

import { useState, useCallback } from 'react';
import type { ToastType } from '../components/Toast';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const show = useCallback(
    (message: string, type: ToastType = 'info') => {
      setToast({ visible: true, message, type });
    },
    []
  );

  const success = useCallback((message: string) => {
    show(message, 'success');
  }, [show]);

  const error = useCallback((message: string) => {
    show(message, 'error');
  }, [show]);

  const warning = useCallback((message: string) => {
    show(message, 'warning');
  }, [show]);

  const info = useCallback((message: string) => {
    show(message, 'info');
  }, [show]);

  const hide = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    toast,
    show,
    success,
    error,
    warning,
    info,
    hide,
  };
}
