/**
 * Toast Component
 *
 * Simple toast notification system for showing temporary messages
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  visible: boolean;
  onHide: () => void;
}

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    iconColor: '#10B981',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-500',
  },
  error: {
    icon: XCircle,
    iconColor: '#EF4444',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-500',
  },
  warning: {
    icon: AlertCircle,
    iconColor: '#F59E0B',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-500',
  },
  info: {
    icon: Info,
    iconColor: '#3B82F6',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-500',
  },
};

export function Toast({
  message,
  type = 'info',
  duration = 3000,
  visible,
  onHide,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const config = TOAST_CONFIG[type];
  const Icon = config.icon;

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      className={`absolute top-14 left-4 right-4 z-50 flex-row items-center gap-3 p-4 rounded-xl shadow-lg border-l-4 ${config.bgClass} ${config.borderClass}`}
    >
      <Icon size={20} color={config.iconColor} />
      <Text className="flex-1 text-sm font-medium text-textPrimary">
        {message}
      </Text>
    </Animated.View>
  );
}
