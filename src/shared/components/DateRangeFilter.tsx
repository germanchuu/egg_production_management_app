import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '@/core/theme';

export type DateRange = '7D' | '30D' | '90D' | 'Todo';

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const OPTIONS: { label: string; value: DateRange }[] = [
  { label: '7D', value: '7D' },
  { label: '30D', value: '30D' },
  { label: '90D', value: '90D' },
  { label: 'Todo', value: 'Todo' },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => (
  <View style={styles.container}>
    {OPTIONS.map((opt) => {
      const isActive = opt.value === value;
      return (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={[styles.option, isActive && styles.optionActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: isActive }}
        >
          <Text style={[styles.label, { color: isActive ? theme.colors.primary['600'] : theme.colors.gray['500'] }]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  option: {
    alignItems: 'center',
    borderRadius: 7,
    flex: 1,
    paddingVertical: 6,
  },
  optionActive: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
});

/**
 * Returns the start date for a given DateRange relative to today.
 * For 'Todo' returns the lot start date (or null if not provided).
 */
export function getStartDate(range: DateRange, lotStartDate?: string): string | null {
  if (range === 'Todo') return lotStartDate ?? null;
  const days = range === '7D' ? 7 : range === '30D' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}
