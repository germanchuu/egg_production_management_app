import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Egg,
  Bird,
  Skull,
  Wheat,
} from 'lucide-react-native';
import { theme } from '@/core/theme';
import { formatDate } from '@/shared/utils/date';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { ProductionServiceProvider } from '@/features/production/services/ProductionServiceProvider';
import { MortalityServiceProvider } from '@/features/mortality/services/MortalityServiceProvider';
import { FeedingServiceProvider } from '@/features/feeding/services/FeedingServiceProvider';

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface HomeMetrics {
  eggs: string;
  activeLots: string;
  deaths: string;
  feed: string;
}

function useHomeMetrics() {
  const [metrics, setMetrics] = useState<HomeMetrics>({
    eggs: '—',
    activeLots: '—',
    deaths: '—',
    feed: '—',
  });

  useFocusEffect(
    useCallback(() => {
    async function load() {
      try {
        const today = formatDate(new Date());

        const facilityService =
          await FacilityServiceProvider.getFacilityService();
        const lotsResult = await facilityService.listActiveLots();
        if (!lotsResult.success || !lotsResult.data) {
          setMetrics({
            eggs: 'N/A',
            activeLots: 'N/A',
            deaths: 'N/A',
            feed: 'N/A',
          });
          return;
        }

        const lots = lotsResult.data;

        const [productionService, mortalityService, feedingService] =
          await Promise.all([
            ProductionServiceProvider.getProductionService(),
            MortalityServiceProvider.getMortalityService(),
            FeedingServiceProvider.getFeedingService(),
          ]);

        let totalEggs = 0;
        let totalDeaths = 0;
        let totalFeed = 0;

        await Promise.all(
          lots.map(async (lot) => {
            const [prodResult, mortResult, feedResult] = await Promise.all([
              productionService.getProductionByDay(lot.id, today),
              mortalityService.getMortalityByDay(lot.id, today),
              feedingService.getFeedingHistory(lot.id),
            ]);

            if (prodResult.success && prodResult.data) {
              totalEggs += prodResult.data.reduce(
                (sum, r) => sum + r.eggsCollected,
                0
              );
            }

            if (mortResult.success && mortResult.data) {
              totalDeaths += mortResult.data.reduce(
                (sum, r) => sum + r.hensDied,
                0
              );
            }

            if (feedResult.success && feedResult.data) {
              totalFeed += feedResult.data
                .filter((r) => r.date === today)
                .reduce((sum, r) => sum + r.quantityFedKg, 0);
            }
          })
        );

        setMetrics({
          eggs: totalEggs.toLocaleString('es-ES'),
          activeLots: String(lots.length),
          deaths: String(totalDeaths),
          feed: `${totalFeed.toFixed(1)} kg`,
        });
      } catch {
        setMetrics({
          eggs: 'N/A',
          activeLots: 'N/A',
          deaths: 'N/A',
          feed: 'N/A',
        });
      }
    }

    load();
    }, [])
  );

  return metrics;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MetricSection() {
  const metrics = useHomeMetrics();

  const cards = [
    {
      icon: Egg,
      value: metrics.eggs,
      label: 'Huevos Hoy',
      iconBgClassName: 'bg-primary/10',
      iconClassName: 'text-primary',
    },
    {
      icon: Bird,
      value: metrics.activeLots,
      label: 'Lotes activos',
      iconBgClassName: 'bg-success/10',
      iconClassName: 'text-success',
    },
    {
      icon: Skull,
      value: metrics.deaths,
      label: 'Mortalidad Hoy',
      iconBgClassName: 'bg-error/10',
      iconClassName: 'text-error',
    },
    {
      icon: Wheat,
      value: metrics.feed,
      label: 'Alimento Hoy',
      iconBgClassName: 'bg-warning/10',
      iconClassName: 'text-warning',
    },
  ];

  return (
    <View className="space-y-3">
      <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wide mb-md">
        Métricas
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {cards.map((card) => (
          <View key={card.label} className="w-[48%]">
            <MetricCard {...card} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  value: string | number;
  label: string;
  iconBgClassName?: string;
  iconClassName?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

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
  iconBgClassName = '',
  iconClassName = '',
}: MetricCardProps) {
  const iconColor = getColorFromClassName(iconClassName);

  return (
    <AnimatedView
      entering={FadeIn}
      className="rounded-xl p-4 bg-background border border-gray-200 shadow-card"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View
          className={`h-10 w-10 rounded-xl items-center justify-center ${iconBgClassName}`}
        >
          <Icon size={20} color={iconColor} />
        </View>
      </View>

      <Text className="text-2xl font-bold text-textPrimary">{value}</Text>
      <Text className="text-xs text-textSecondary mt-0.5">{label}</Text>
    </AnimatedView>
  );
}
