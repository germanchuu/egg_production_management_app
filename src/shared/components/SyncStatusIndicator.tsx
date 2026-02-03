import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SyncStatus } from '@/shared/hooks/useSync';

export interface SyncStatusIndicatorProps {
  status: SyncStatus;
  pendingCount?: number;
  showLabel?: boolean;
  onPress?: () => void;
  onRetry?: () => void;
  compact?: boolean;
}

/**
 * Visual config adapted from web SyncStatusIndicator
 */
function getStatusConfig(status: SyncStatus) {
  switch (status) {
    case 'synced':
      return {
        icon: 'checkmark-circle',
        label: 'Sincronizado',
        containerClass: 'bg-success/10 border border-success/20',
        textClass: 'text-success',
        animate: false,
      };
    case 'pending':
      return {
        icon: 'time-outline',
        label: 'Cambios pendientes',
        containerClass: 'bg-warning/10 border border-warning/20',
        textClass: 'text-warning',
        animate: false,
      };
    case 'syncing':
      return {
        icon: 'sync',
        label: 'Sincronizando...',
        containerClass: 'bg-info/10 border border-info/20',
        textClass: 'text-info',
        animate: true,
      };
    case 'failed':
      return {
        icon: 'alert-circle',
        label: 'Error de sincronización',
        containerClass: 'bg-error/10 border border-error/20',
        textClass: 'text-error',
        animate: false,
      };
  }
}

/**
 * SyncStatusIndicator – Native version styled like web component
 */
export function SyncStatusIndicator({
  status,
  pendingCount = 0,
  showLabel = true,
  onPress,
  onRetry,
  compact = false,
}: SyncStatusIndicatorProps) {
  const config = getStatusConfig(status);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (config.animate) {
      const animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      animation.start();
      return () => {
        animation.stop();
        spinValue.setValue(0);
      };
    }

    spinValue.setValue(0);
  }, [config.animate, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const iconSize = compact ? 16 : 18;

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={0.8}
      className={`
        flex-row
        items-center
        justify-between
        gap-md
        px-md
        py-sm
        rounded-xl
        ${config.containerClass}
      `}
      accessibilityLabel={`Estado de sincronización: ${config.label}`}
    >
      {/* Left: icon + text */}
      <View className="flex-row items-center gap-sm flex-1">
        <Animated.View
          style={config.animate ? { transform: [{ rotate: spin }] } : undefined}
        >
          <Ionicons size={iconSize} className={config.textClass} />
        </Animated.View>

        {showLabel && (
          <Text
            className={`text-sm font-medium ${config.textClass}`}
            numberOfLines={1}
          >
            {status === 'pending' && pendingCount > 0
              ? `${pendingCount} cambios pendientes`
              : config.label}
          </Text>
        )}
      </View>

      {/* Right: retry button */}
      {status === 'failed' && onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="flex-row items-center gap-xs px-sm py-xs rounded-md"
          accessibilityLabel="Reintentar sincronización"
        >
          <Ionicons name="refresh" size={14} className="text-error" />
          <Text className="text-xs font-medium text-error">Reintentar</Text>
        </TouchableOpacity>
      )}
    </Container>
  );
}
