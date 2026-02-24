/**
 * ToastContext
 *
 * Global toast notification system that persists across screen navigation.
 * Provides centralized toast management for the entire app.
 *
 * Usage:
 * ```typescript
 * import { useToastContext } from '@/shared/contexts/ToastContext';
 *
 * function MyComponent() {
 *   const { success, error } = useToastContext();
 *
 *   const handleSave = async () => {
 *     const result = await save();
 *     if (result.success) {
 *       success('Guardado correctamente');
 *     } else {
 *       error('Error al guardar');
 *     }
 *   };
 * }
 * ```
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastType } from '@/shared/components';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  hide: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const show = useCallback(
    (message: string, type: ToastType = 'info', duration?: number) => {
      setToast({ visible: true, message, type });
    },
    []
  );

  const success = useCallback(
    (message: string, duration?: number) => {
      show(message, 'success', duration);
    },
    [show]
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      show(message, 'error', duration);
    },
    [show]
  );

  const warning = useCallback(
    (message: string, duration?: number) => {
      show(message, 'warning', duration);
    },
    [show]
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      show(message, 'info', duration);
    },
    [show]
  );

  const hide = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info, hide }}>
      {children}
      <Toast {...toast} onHide={hide} />
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}
