/**
 * DatePicker Component
 *
 * Native date picker with 48dp minimum touch target.
 * Prevents future dates for historical production records.
 *
 * Usage:
 * ```tsx
 * <DatePicker
 *   label="Fecha"
 *   value={selectedDate}
 *   onChange={setSelectedDate}
 *   error={errors.date}
 *   required
 * />
 * ```
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { formatDate } from '@/shared/utils/date';

export interface DatePickerProps {
  /** Label displayed above date picker */
  label: string;

  /** Current selected date */
  value: Date;

  /** Change handler */
  onChange: (date: Date) => void;

  /** Error message to display */
  error?: string;

  /** Whether picker is disabled */
  disabled?: boolean;

  /** Whether field is required */
  required?: boolean;

  /** Maximum selectable date (defaults to today to prevent future dates) */
  maxDate?: Date;

  /** Minimum selectable date */
  minDate?: Date;

  /** Help text displayed below picker */
  helpText?: string;
}

/**
 * DatePicker component with native date picker integration
 */
export function DatePicker({
  label,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  maxDate = new Date(), // Default: no future dates
  minDate,
  helpText,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const hasError = Boolean(error);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // On Android, hide picker after selection
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    // Update value if date was selected (not cancelled)
    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
    }

    // On iOS, cancelled event
    if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  };

  const handlePress = () => {
    if (!disabled) {
      Haptics.selectionAsync();
      setShowPicker(true);
    }
  };

  const displayDate = formatDate(value);

  return (
    <View className="mb-lg">
      {/* Label */}
      <View className="flex-row items-center mb-sm">
        <Text className="text-base font-medium text-text-textPrimary">
          {label}
        </Text>
        {required && <Text className="text-error ml-1">*</Text>}
      </View>

      {/* Touch Area - min 48dp height */}
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={helpText ?? `Seleccionar ${label}`}
        accessibilityState={{ disabled }}
        accessibilityValue={{ text: displayDate }}
        className={`
          px-lg py-md
          min-h-[48px]
          bg-white
          border rounded-md
          flex-row items-center justify-between
          ${hasError ? 'border-error' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 opacity-disabled' : ''}
        `}
      >
        <Text
          className={`
            text-base
            ${disabled ? 'text-text-textTertiary' : 'text-text-textPrimary'}
          `}
        >
          {displayDate}
        </Text>
        <Text className="text-lg text-text-textSecondary">📅</Text>
      </TouchableOpacity>

      {/* Native Date Picker */}
      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          maximumDate={maxDate}
          minimumDate={minDate}
          disabled={disabled}
        />
      )}

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
