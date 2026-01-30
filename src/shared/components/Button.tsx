/**
 * Button Component
 *
 * Reusable button with haptic feedback, large touch targets (48dp minimum),
 * loading states, and variant support.
 *
 * Usage:
 * ```tsx
 * <Button
 *   variant="primary"
 *   onPress={handleSubmit}
 *   loading={isLoading}
 * >
 *   Guardar
 * </Button>
 *
 * <Button
 *   variant="secondary"
 *   icon="trash"
 *   iconPosition="left"
 *   onPress={handleDelete}
 * >
 *   Eliminar
 * </Button>
 * ```
 */

import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  type PressableProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type IconPosition = 'left' | 'right';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  /** Button variant for styling */
  variant?: ButtonVariant;

  /** Button label text */
  children: string;

  /** Loading state - shows spinner and disables button */
  loading?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;

  /** Icon position relative to text */
  iconPosition?: IconPosition;

  /** Press handler */
  onPress?: () => void;
}

/**
 * Get background color class based on variant
 */
function getVariantBackgroundClass(variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
      return 'bg-primary-500';
    case 'secondary':
      return 'bg-gray-500';
    case 'danger':
      return 'bg-error';
    default:
      return 'bg-primary-500';
  }
}

/**
 * Get text color class based on variant
 */
function getVariantTextClass(): string {
  // All variants use white text
  return 'text-white';
}

/**
 * Button component with 48dp minimum touch target and haptic feedback
 */
export function Button({
  variant = 'primary',
  children,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  onPress,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (!isDisabled && onPress) {
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const backgroundClass = getVariantBackgroundClass(variant);
  const textClass = getVariantTextClass();

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      className={`
        px-xl py-md
        min-h-[48px]
        rounded-md
        flex-row items-center justify-center
        ${backgroundClass}
        ${isDisabled ? 'opacity-disabled' : ''}
      `}
      style={({ pressed }) => ({
        opacity: pressed && !isDisabled ? 0.8 : 1,
      })}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <View className="flex-row items-center justify-center">
          {/* Icon Left */}
          {icon && iconPosition === 'left' && (
            <View className="mr-2">
              <Ionicons name={icon} size={20} color="#FFFFFF" />
            </View>
          )}

          {/* Button Text */}
          <Text className={`text-base font-semibold ${textClass}`}>
            {children}
          </Text>

          {/* Icon Right */}
          {icon && iconPosition === 'right' && (
            <View className="ml-2">
              <Ionicons name={icon} size={20} color="#FFFFFF" />
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}
