import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSyncContext, type SyncStatus } from '@/shared/contexts';
import { RefreshCw } from 'lucide-react-native';
import { theme } from '@/core/theme';

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
 * Base component that accepts props directly
 */
export function SyncStatusIndicatorBase({
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
          className="flex-row items-center gap-sm px-sm py-xs rounded-md"
          accessibilityLabel="Reintentar sincronización"
        >
          <RefreshCw size={16} color={theme.colors.error.DEFAULT} />
          <Text className="text-xs font-medium text-error">Reintentar</Text>
        </TouchableOpacity>
      )}
    </Container>
  );
}

/**
 * SyncStatusIndicator with automatic SyncContext integration
 *
 * This wrapper automatically uses the global SyncContext.
 * Use this version when you want automatic sync state.
 */
export interface SyncStatusIndicatorAutoProps {
  showLabel?: boolean;
  onPress?: () => void;
  compact?: boolean;
}

export function SyncStatusIndicator({
  showLabel = true,
  onPress,
  compact = false,
}: SyncStatusIndicatorAutoProps) {
  const { status, pendingCount, sync } = useSyncContext();

  return (
    <SyncStatusIndicatorBase
      status={status}
      pendingCount={pendingCount}
      showLabel={showLabel}
      onPress={onPress}
      onRetry={status === 'failed' ? sync : undefined}
      compact={compact}
    />
  );
}
