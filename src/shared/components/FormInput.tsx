/**
 * FormInput Component
 *
 * Reusable form input with large touch targets (48dp minimum),
 * support for numeric keyboard, and clean visual design.
 *
 * Usage:
 * ```tsx
 * <FormInput
 *   label="Cantidad de Huevos"
 *   value={value}
 *   onChangeText={setValue}
 *   keyboardType="numeric"
 *   placeholder="0"
 *   error={errors.eggs}
 * />
 * ```
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  KeyboardTypeOptions,
} from 'react-native';

export interface FormInputProps extends Omit<TextInputProps, 'className'> {
  /** Input label displayed above field */
  label: string;

  /** Current input value */
  value: string;

  /** Change handler */
  onChangeText: (text: string) => void;

  /** Keyboard type (numeric, default, email-address, etc.) */
  keyboardType?: KeyboardTypeOptions;

  /** Placeholder text */
  placeholder?: string;

  /** Error message to display */
  error?: string;

  /** Whether input is disabled */
  disabled?: boolean;

  /** Whether input is required */
  required?: boolean;

  /** Help text displayed below input */
  helpText?: string;
}

/**
 * FormInput component with 48dp minimum touch target
 */
export function FormInput({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  placeholder,
  error,
  disabled = false,
  required = false,
  helpText,
  ...rest
}: FormInputProps) {
  const hasError = Boolean(error);

  return (
    <View className="mb-lg">
      {/* Label */}
      <View className="flex-row items-center mb-sm">
        <Text className="text-base font-medium text-text-textPrimary">
          {label}
        </Text>
        {required && <Text className="text-error ml-1">*</Text>}
      </View>

      {/* Input Field - min 48dp height */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#9E9E9E"
        editable={!disabled}
        accessibilityLabel={label}
        accessibilityHint={helpText}
        accessibilityState={{ disabled }}
        className={`
          px-lg py-md
          min-h-[48px]
          bg-white
          border rounded-md
          text-base text-text-textPrimary
          ${hasError ? 'border-error' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 opacity-disabled' : ''}
        `}
        {...rest}
      />

      {/* Error Message */}
      {hasError && <Text className="text-sm text-error mt-xs">{error}</Text>}

      {/* Help Text */}
      {!hasError && helpText && (
        <Text className="text-sm text-text-textSecondary mt-xs">
          {helpText}
        </Text>
      )}
    </View>
  );
}
