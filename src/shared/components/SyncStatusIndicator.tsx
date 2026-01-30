/**
 * SyncStatusIndicator Component
 *
 * Compact component that displays synchronization status with visual feedback.
 * Designed for headers and status bars with minimal intrusion.
 *
 * Status states:
 * - synced: All data synchronized (green checkmark)
 * - pending: Changes waiting to sync (yellow cloud)
 * - syncing: Actively synchronizing (blue rotating sync icon)
 * - failed: Sync failed (red alert)
 *
 * Usage:
 * ```tsx
 * const { status, pendingCount } = useSync();
 * <SyncStatusIndicator
 *   status={status}
 *   pendingCount={pendingCount}
 *   showLabel
 *   onPress={() => console.log('Show sync details')}
 * />
 * ```
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SyncStatus } from '@/shared/hooks/useSync';

export interface SyncStatusIndicatorProps {
  /** Current sync status */
  status: SyncStatus;

  /** Number of pending items (optional, shows badge if > 0) */
  pendingCount?: number;

  /** Whether to show text label alongside icon (default: false) */
  showLabel?: boolean;

  /** Optional press handler for showing sync details */
  onPress?: () => void;

  /** Compact mode - smaller size for tight spaces (default: false) */
  compact?: boolean;
}

/**
 * Get icon name and color for each sync status
 */
function getStatusConfig(status: SyncStatus): {
  icon: keyof typeof Ionicons.glyphMap;
  colorClass: string;
  label: string;
  animate: boolean;
} {
  switch (status) {
    case 'synced':
      return {
        icon: 'checkmark-circle',
        colorClass: 'text-success',
        label: 'Sincronizado',
        animate: false,
      };
    case 'pending':
      return {
        icon: 'cloud-outline',
        colorClass: 'text-warning',
        label: 'Pendiente',
        animate: false,
      };
    case 'syncing':
      return {
        icon: 'sync',
        colorClass: 'text-info',
        label: 'Sincronizando',
        animate: true,
      };
    case 'failed':
      return {
        icon: 'alert-circle',
        colorClass: 'text-error',
        label: 'Error',
        animate: false,
      };
  }
}

/**
 * SyncStatusIndicator component with animation support
 */
export function SyncStatusIndicator({
  status,
  pendingCount = 0,
  showLabel = false,
  onPress,
  compact = false,
}: SyncStatusIndicatorProps) {
  const config = getStatusConfig(status);
  const spinValue = useRef(new Animated.Value(0)).current;

  // Rotation animation for syncing state
  useEffect(() => {
    if (config.animate) {
      // Create continuous rotation animation
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
    } else {
      // Reset rotation when not animating
      spinValue.setValue(0);
    }
  }, [config.animate, spinValue]);

  // Map rotation value to degrees
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const iconSize = compact ? 18 : 20;
  const badgeSize = compact ? 16 : 18;

  const content = (
    <View className="flex-row items-center gap-sm">
      {/* Icon with optional animation */}
      <Animated.View
        style={config.animate ? { transform: [{ rotate: spin }] } : undefined}
      >
        <Ionicons
          name={config.icon}
          size={iconSize}
          className={config.colorClass}
        />
      </Animated.View>

      {/* Optional label text */}
      {showLabel && (
        <Text className={`text-sm font-medium ${config.colorClass}`}>
          {config.label}
        </Text>
      )}

      {/* Badge showing pending count */}
      {pendingCount > 0 && (
        <View
          className="bg-warning rounded-full items-center justify-center min-w-[18px] px-xs"
          style={{ minHeight: badgeSize }}
        >
          <Text className="text-xs font-semibold text-white">
            {pendingCount > 99 ? '99+' : pendingCount}
          </Text>
        </View>
      )}
    </View>
  );

  // Wrap in TouchableOpacity if onPress is provided
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="py-sm px-md"
        accessibilityLabel={`Sync status: ${config.label}`}
        accessibilityHint={
          pendingCount > 0 ? `${pendingCount} items pending sync` : undefined
        }
      >
        {content}
      </TouchableOpacity>
    );
  }

  // Non-interactive version
  return (
    <View
      className="py-sm px-md"
      accessibilityLabel={`Sync status: ${config.label}`}
    >
      {content}
    </View>
  );
}
