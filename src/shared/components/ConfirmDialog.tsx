/**
 * ConfirmDialog Component
 *
 * Beautiful confirmation dialog for destructive or important actions
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      iconColor: '#EF4444',
      iconBg: 'bg-red-100',
      confirmButton: 'bg-error',
    },
    warning: {
      iconColor: '#F59E0B',
      iconBg: 'bg-yellow-100',
      confirmButton: 'bg-warning',
    },
    info: {
      iconColor: '#3B82F6',
      iconBg: 'bg-blue-100',
      confirmButton: 'bg-info',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center px-6"
        onPress={onCancel}
      >
        <Pressable
          className="bg-background w-full max-w-md rounded-2xl shadow-xl"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <View className="items-center pt-6 pb-4">
            <View className={`w-16 h-16 rounded-full ${styles.iconBg} items-center justify-center`}>
              <AlertCircle size={32} color={styles.iconColor} />
            </View>
          </View>

          {/* Content */}
          <View className="px-6 pb-6">
            <Text className="text-xl font-bold text-textPrimary text-center mb-2">
              {title}
            </Text>
            <Text className="text-sm text-textSecondary text-center leading-5">
              {message}
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row border-t border-gray-200">
            <TouchableOpacity
              className="flex-1 py-4 items-center border-r border-gray-200"
              onPress={onCancel}
            >
              <Text className="text-base font-semibold text-textSecondary">
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-4 items-center"
              onPress={onConfirm}
            >
              <Text className={`text-base font-bold ${variant === 'danger' ? 'text-error' : variant === 'warning' ? 'text-warning' : 'text-info'}`}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
