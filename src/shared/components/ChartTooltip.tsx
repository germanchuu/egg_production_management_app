import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChartTooltipProps {
  label: string;
  value: string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({ label, value }) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 6,
    borderWidth: 1,
    elevation: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    color: '#6B7280',
    fontSize: 10,
  },
  value: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '600',
  },
});
