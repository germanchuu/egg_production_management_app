/**
 * ProductionMetricsCard Component
 *
 * Displays production metrics including:
 * - Daily eggs per hen (most recent record)
 * - Lifetime eggs per hen (total / initial count)
 * - Total eggs collected
 * - Average daily production
 */

import React from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import { theme } from '@/core/theme';
import { TrendingUp, Calendar, Egg, BarChart3 } from 'lucide-react-native';

export interface ProductionMetrics {
  dailyEggsPerHen: number;
  lifetimeEggsPerHen: number;
  totalEggs: number;
  averageDaily: number;
}

interface ProductionMetricsCardProps {
  metrics: ProductionMetrics;
  lotName?: string;
}

export const ProductionMetricsCard: React.FC<ProductionMetricsCardProps> = ({
  metrics,
  lotName,
}) => {
  return (
    <View className="bg-white rounded-md shadow-sm border border-gray-100 p-lg">
      {/* Header */}
      {lotName && (
        <Text className="text-base font-semibold text-textPrimary mb-md">
          Métricas de Producción - {lotName}
        </Text>
      )}

      {/* Metrics Grid */}
      <View className="gap-md">
        {/* Row 1: Daily and Lifetime Eggs per Hen */}
        <View className="flex-row gap-md">
          {/* Daily Eggs per Hen */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 250, delay: 0 }}
            className="flex-1 bg-primary-50 rounded-md p-md"
          >
            <View className="flex-row items-center gap-xs mb-xs">
              <View className="w-7 h-7 rounded-full bg-primary-500/20 items-center justify-center">
                <Calendar size={14} color={theme.colors.primary['500']} />
              </View>
              <Text className="text-xs font-medium text-primary-700">Diario</Text>
            </View>
            <Text className="text-2xl font-bold text-textPrimary">
              {metrics.dailyEggsPerHen.toFixed(2)}
            </Text>
            <Text className="text-xs text-textSecondary mt-xs">
              huevos/gallina/día
            </Text>
          </MotiView>

          {/* Lifetime Eggs per Hen */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 250, delay: 50 }}
            className="flex-1 bg-secondary-50 rounded-md p-md"
          >
            <View className="flex-row items-center gap-xs mb-xs">
              <View className="w-7 h-7 rounded-full bg-secondary-500/20 items-center justify-center">
                <TrendingUp size={14} color={theme.colors.secondary['500']} />
              </View>
              <Text className="text-xs font-medium text-secondary-700">
                Historial
              </Text>
            </View>
            <Text className="text-2xl font-bold text-textPrimary">
              {metrics.lifetimeEggsPerHen.toFixed(2)}
            </Text>
            <Text className="text-xs text-textSecondary mt-xs">
              huevos/gallina (total)
            </Text>
          </MotiView>
        </View>

        {/* Row 2: Total Eggs and Average Daily */}
        <View className="flex-row gap-md">
          {/* Total Eggs */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 250, delay: 100 }}
            className="flex-1 bg-success-50 rounded-md p-md"
          >
            <View className="flex-row items-center gap-xs mb-xs">
              <View className="w-7 h-7 rounded-full bg-success/20 items-center justify-center">
                <Egg size={14} color={theme.colors.success.DEFAULT} />
              </View>
              <Text className="text-xs font-medium text-success">Total</Text>
            </View>
            <Text className="text-2xl font-bold text-textPrimary">
              {metrics.totalEggs.toLocaleString('es-ES')}
            </Text>
            <Text className="text-xs text-textSecondary mt-xs">
              huevos recolectados
            </Text>
          </MotiView>

          {/* Average Daily */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 250, delay: 150 }}
            className="flex-1 bg-amber-50 rounded-md p-md"
          >
            <View className="flex-row items-center gap-xs mb-xs">
              <View className="w-7 h-7 rounded-full bg-amber-500/20 items-center justify-center">
                <BarChart3 size={14} color={theme.colors.accent['500']} />
              </View>
              <Text className="text-xs font-medium text-amber-700">Promedio</Text>
            </View>
            <Text className="text-2xl font-bold text-textPrimary">
              {metrics.averageDaily}
            </Text>
            <Text className="text-xs text-textSecondary mt-xs">huevos/día</Text>
          </MotiView>
        </View>
      </View>

      {/* Footer Note */}
      <View className="mt-md pt-md border-t border-gray-200">
        <Text className="text-xs text-textTertiary text-center">
          Métricas calculadas basadas en el historial de producción del lote
        </Text>
      </View>
    </View>
  );
};
