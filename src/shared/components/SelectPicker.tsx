/**
 * SelectPicker Component
 *
 * Native-like selector following the same UI rules as DatePicker:
 * - 48dp minimum touch target
 * - Label + error + help text
 * - Disabled + required states
 *
 * Usage:
 * ```tsx
 * <SelectPicker
 *   label="Galpón"
 *   value={selectedHouse}
 *   onChange={setSelectedHouse}
 *   options={[
 *     { label: 'Galpón 1', value: '1' },
 *     { label: 'Galpón 2', value: '2' },
 *   ]}
 *   error={errors.house}
 *   required
 * />
 * ```
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export interface SelectPickerProps<T = string> {
  /** Label displayed above selector */
  label: string;

  /** Current selected value */
  value: T | null;

  /** Options list */
  options: SelectOption<T>[];

  /** Change handler */
  onChange: (value: T) => void;

  /** Error message to display */
  error?: string;

  /** Whether selector is disabled */
  disabled?: boolean;

  /** Whether field is required */
  required?: boolean;

  /** Help text displayed below */
  helpText?: string;

  /** Placeholder when no value selected */
  placeholder?: string;
}

export function SelectPicker<T = string>({
  label,
  value,
  options,
  onChange,
  error,
  disabled = false,
  required = false,
  helpText,
  placeholder = 'Seleccionar...',
}: SelectPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const hasError = Boolean(error);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleOpen = () => {
    if (!disabled) {
      Haptics.selectionAsync();
      setOpen(true);
    }
  };

  const handleSelect = (val: T) => {
    Haptics.selectionAsync();
    onChange(val);
    setOpen(false);
  };

  return (
    <View className="mb-lg">
      {/* Label */}
      <View className="flex-row items-center mb-sm">
        <Text className="text-base font-medium text-text-textPrimary">
          {label}
        </Text>
        {required && <Text className="text-error ml-1">*</Text>}
      </View>

      {/* Touch Area */}
      <TouchableOpacity
        onPress={handleOpen}
        disabled={disabled}
        activeOpacity={0.7}
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
            ${
              disabled
                ? 'text-text-textTertiary'
                : selectedOption
                  ? 'text-text-textPrimary'
                  : 'text-text-textSecondary'
            }
          `}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>

        <Text className="text-lg text-text-textSecondary">▾</Text>
      </TouchableOpacity>

      {/* Modal Selector */}
      <Modal visible={open} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/30 justify-end"
          onPress={() => setOpen(false)}
        >
          <View className="bg-white rounded-t-2xl p-lg max-h-[60%]">
            <Text className="text-base font-semibold mb-md">{label}</Text>

            <FlatList
              data={options}
              keyExtractor={(item, index) => `${index}`}
              renderItem={({ item }) => {
                const isSelected = item.value === value;

                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item.value)}
                    className={`
                      px-md py-md rounded-md mb-xs
                      flex-row justify-between items-center
                      ${isSelected ? 'bg-primary/10' : ''}
                    `}
                  >
                    <Text
                      className={`
                        text-base
                        ${
                          isSelected
                            ? 'text-primary font-semibold'
                            : 'text-text-textPrimary'
                        }
                      `}
                    >
                      {item.label}
                    </Text>

                    {isSelected && (
                      <Text className="text-primary font-bold">✓</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Error */}
      {hasError && <Text className="text-sm text-error mt-xs">{error}</Text>}

      {/* Help text */}
      {!hasError && helpText && (
        <Text className="text-sm text-text-textSecondary mt-xs">
          {helpText}
        </Text>
      )}
    </View>
  );
}
