/**
 * Button Component
 *
 * Reusable button with haptic feedback, large touch targets (48dp minimum),
 * loading states, and variant support.
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
import type { LucideIcon } from 'lucide-react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type IconPosition = 'left' | 'right';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  children: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  iconPosition?: IconPosition;
  onPress?: () => void;
}

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

function getVariantTextClass(): string {
  return 'text-white';
}

export function Button({
  variant = 'primary',
  children,
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  onPress,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (!isDisabled && onPress) {
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
        <View className="flex-row items-center justify-center min-w-0">
          {Icon && iconPosition === 'left' && (
            <View className="mr-2">
              <Icon size={20} color="#FFFFFF" />
            </View>
          )}

          <Text
            numberOfLines={1}
            className={`text-base font-semibold ${textClass}`}
          >
            {children}
          </Text>

          {Icon && iconPosition === 'right' && (
            <View className="ml-2">
              <Icon size={20} color="#FFFFFF" />
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}
