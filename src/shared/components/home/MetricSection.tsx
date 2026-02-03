import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Egg,
  Activity,
  Skull,
  Wheat,
} from 'lucide-react-native';
import { theme } from '@/core/theme';

export function MetricSection() {
  const metrics = [
    {
      icon: Egg,
      value: '1,234',
      label: 'Huevos Hoy',
      trend: { value: 5, isPositive: true },
      iconBgClassName: 'bg-primary/10',
      iconClassName: 'text-primary',
    },
    {
      icon: Activity,
      value: '94.5%',
      label: 'Tasa Postura',
      trend: { value: 2, isPositive: true },
      iconBgClassName: 'bg-success/10',
      iconClassName: 'text-success',
    },
    {
      icon: Skull,
      value: '3',
      label: 'Mortalidad Hoy',
      trend: { value: 1, isPositive: false },
      iconBgClassName: 'bg-error/10',
      iconClassName: 'text-error',
    },
    {
      icon: Wheat,
      value: '450 kg',
      label: 'Alimento Hoy',
      trend: { value: 0, isPositive: true },
      iconBgClassName: 'bg-warning/10',
      iconClassName: 'text-warning',
    },
  ];

  return (
    <View className="space-y-3">
      {/* Header */}

      <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wide mb-md">
        Métricas
      </Text>

      {/* Grid 2x2 */}
      <View className="flex-row flex-wrap gap-3">
        {metrics.map((metric) => (
          <View key={metric.label} className="w-[48%]">
            <MetricCard {...metric} />
          </View>
        ))}
      </View>
    </View>
  );
}

interface MetricCardProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  iconBgClassName?: string;
  iconClassName?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

// Helper to convert className to color value
const getColorFromClassName = (className: string): string => {
  const colorMap: Record<string, string> = {
    'text-primary': theme.colors.primary['500'] || theme.colors.primary.DEFAULT,
    'text-success': theme.colors.success.DEFAULT,
    'text-error': theme.colors.error.DEFAULT,
    'text-warning': theme.colors.warning.DEFAULT,
    'text-gray-600': theme.colors.gray['600'],
  };
  return colorMap[className] || theme.colors['text-textPrimary'] || '#212121';
};

function MetricCard({
  icon: Icon,
  value,
  label,
  trend,
  iconBgClassName = '',
  iconClassName = '',
}: MetricCardProps) {
  const TrendIcon = trend
    ? trend.value === 0
      ? Minus
      : trend.isPositive
        ? TrendingUp
        : TrendingDown
    : null;

  const trendContainerClass = trend
    ? trend.value === 0
      ? 'bg-gray-200'
      : trend.isPositive
        ? 'bg-success/10'
        : 'bg-error/10'
    : '';

  const trendTextClass = trend
    ? trend.value === 0
      ? 'text-gray-600'
      : trend.isPositive
        ? 'text-success'
        : 'text-error'
    : '';

  const iconColor = getColorFromClassName(iconClassName);
  const trendColor = getColorFromClassName(trendTextClass);

  return (
    <AnimatedView
      entering={FadeIn}
      className="rounded-xl p-4 bg-background border border-gray-200 shadow-card"
    >
      <View className="flex-row items-start justify-between mb-3">
        {/* Icon */}
        <View
          className={`h-10 w-10 rounded-xl items-center justify-center ${iconBgClassName}`}
        >
          <Icon size={20} color={iconColor} />
        </View>

        {/* Trend */}
        {trend && TrendIcon && (
          <View
            className={`flex-row items-center gap-0.5 px-2 py-0.5 rounded-full ${trendContainerClass}`}
          >
            <TrendIcon size={12} color={trendColor} />
            <Text className={`text-xs font-medium ${trendTextClass}`}>
              {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>

      <Text className="text-2xl font-bold text-textPrimary">{value}</Text>
      <Text className="text-xs text-textSecondary mt-0.5">{label}</Text>
    </AnimatedView>
  );
}
