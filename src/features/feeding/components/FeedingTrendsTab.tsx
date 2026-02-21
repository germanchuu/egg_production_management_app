import React, { useMemo } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Scale, Wheat, Calendar } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { ChickenLot } from '@/shared/types/entities';
import { FeedingRecordWithMetrics } from '@/features/feeding/services/FeedingService';
import { ChartTooltip } from '@/shared/components/ChartTooltip';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 48;

interface FeedingTrendsTabProps {
  records: FeedingRecordWithMetrics[];
  lot: ChickenLot;
  allDates: string[];
}

function fmtDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, color }) => (
  <View className="flex-1 bg-white rounded-md border border-gray-100 shadow-sm p-md">
    <View className="flex-row items-center gap-xs mb-xs">
      <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: color + '20' }}>
        {icon}
      </View>
      <Text className="text-xs text-textSecondary flex-1" numberOfLines={1}>{label}</Text>
    </View>
    <Text className="text-xl font-bold text-textPrimary">{value}</Text>
    {sub ? <Text className="text-xs text-textTertiary mt-xs">{sub}</Text> : null}
  </View>
);

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <View className="bg-gray-50 rounded-md border border-gray-100 items-center justify-center py-xl">
    <Text className="text-textTertiary text-sm">{message}</Text>
  </View>
);

/**
 * Aggregate feeding records into daily totals.
 * Multiple records per day (different batches) are summed.
 * feedPerHen is recomputed from the daily total / henCount.
 */
function aggregateByDay(
  records: FeedingRecordWithMetrics[],
  henCount: number
): { date: string; totalKg: number; feedPerHen: number }[] {
  const map = new Map<string, number>();
  records.forEach((r) => {
    map.set(r.date, (map.get(r.date) ?? 0) + r.quantityFedKg);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totalKg]) => ({
      date,
      totalKg,
      feedPerHen: totalKg / henCount,
    }));
}

export const FeedingTrendsTab: React.FC<FeedingTrendsTabProps> = ({ records, lot }) => {
  const henCount = lot.liveHenCount || lot.initialHenCount || 1;

  /** One entry per unique day, summing all batches fed that day */
  const dailyTotals = useMemo(
    () => aggregateByDay(records, henCount),
    [records, henCount]
  );

  const consumoData = useMemo(
    () =>
      dailyTotals.map((d) => ({
        value: parseFloat(d.totalKg.toFixed(2)),
        label: fmtDate(d.date),
        dataPointColor: theme.colors.primary['600'],
      })),
    [dailyTotals]
  );

  const feedPerHenData = useMemo(
    () =>
      dailyTotals.map((d) => ({
        value: parseFloat(d.feedPerHen.toFixed(4)),
        label: fmtDate(d.date),
        dataPointColor: theme.colors.secondary['600'],
      })),
    [dailyTotals]
  );

  // KPIs — based on daily totals
  const totalKg = useMemo(() => dailyTotals.reduce((s, d) => s + d.totalKg, 0), [dailyTotals]);
  const uniqueDays = dailyTotals.length;
  const avgPerHen = uniqueDays > 0
    ? (dailyTotals.reduce((s, d) => s + d.feedPerHen, 0) / uniqueDays).toFixed(3)
    : '0';
  const maxDay = useMemo(
    () => dailyTotals.reduce((best, d) => (d.totalKg > best.totalKg ? d : best), { date: '', totalKg: 0, feedPerHen: 0 }),
    [dailyTotals]
  );

  const primaryColor = theme.colors.primary['600'];
  const secondaryColor = theme.colors.secondary['600'];

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* KPIs */}
      <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wide mb-sm">
        Resumen del período
      </Text>
      <View className="flex-row gap-sm mb-sm">
        <KpiCard
          icon={<Scale size={14} color={primaryColor} />}
          label="Total consumido"
          value={`${totalKg.toFixed(1)} kg`}
          sub="en el período"
          color={theme.colors.primary['600']}
        />
        <KpiCard
          icon={<Wheat size={14} color={secondaryColor} />}
          label="Prom. kg/gallina"
          value={avgPerHen}
          sub="kg/gallina/día"
          color={theme.colors.secondary['600']}
        />
      </View>
      <View className="flex-row gap-sm mb-lg">
        <KpiCard
          icon={<Calendar size={14} color={primaryColor} />}
          label="Mayor consumo"
          value={maxDay.totalKg > 0 ? `${maxDay.totalKg.toFixed(1)} kg` : '—'}
          sub={maxDay.date ? fmtDate(maxDay.date) : 'sin datos'}
          color={theme.colors.primary['600']}
        />
        <KpiCard
          icon={<Scale size={14} color={secondaryColor} />}
          label="Días registrados"
          value={String(uniqueDays)}
          sub="en el período"
          color={theme.colors.secondary['600']}
        />
      </View>

      {/* Consumo diario */}
      <Text className="text-sm font-semibold text-textPrimary mb-sm">Consumo diario (kg)</Text>
      {consumoData.length > 1 ? (
        <View className="bg-white rounded-md border border-gray-100 p-md mb-lg">
          <LineChart
            data={consumoData}
            width={CHART_WIDTH - 32}
            height={180}
            color={primaryColor}
            thickness={2}
            noOfSections={4}
            xAxisLabelTextStyle={{ fontSize: 9, color: theme.colors.gray['500'] }}
            yAxisTextStyle={{ fontSize: 10, color: theme.colors.gray['500'] }}
            hideDataPoints={consumoData.length > 30}
            isAnimated
            pointerConfig={{
              activatePointersInstantlyOnTouch: true,
              autoAdjustPointerLabelPosition: true,
              persistPointer: false,
              pointerLabelHeight: 50,
              pointerLabelWidth: 120,
              pointerLabelComponent: (items: Array<{ label?: string; value?: number }>) => (
                <ChartTooltip label={items[0]?.label ?? ''} value={`${items[0]?.value ?? 0} kg`} />
              ),
              pointerStripColor: '#9CA3AF',
              pointerStripWidth: 1,
              showPointerStrip: true,
            }}
          />
        </View>
      ) : (
        <EmptyChart message={records.length === 0 ? 'Sin datos en este período' : 'Se necesitan al menos 2 días con registros'} />
      )}

      {/* kg por gallina */}
      <Text className="text-sm font-semibold text-textPrimary mb-sm">kg por gallina / día</Text>
      {feedPerHenData.length > 1 ? (
        <View className="bg-white rounded-md border border-gray-100 p-md mb-lg">
          <LineChart
            data={feedPerHenData}
            width={CHART_WIDTH - 32}
            height={180}
            color={secondaryColor}
            thickness={2}
            noOfSections={4}
            xAxisLabelTextStyle={{ fontSize: 9, color: theme.colors.gray['500'] }}
            yAxisTextStyle={{ fontSize: 10, color: theme.colors.gray['500'] }}
            hideDataPoints={feedPerHenData.length > 30}
            isAnimated
            pointerConfig={{
              activatePointersInstantlyOnTouch: true,
              autoAdjustPointerLabelPosition: true,
              persistPointer: false,
              pointerLabelHeight: 50,
              pointerLabelWidth: 120,
              pointerLabelComponent: (items: Array<{ label?: string; value?: number }>) => (
                <ChartTooltip label={items[0]?.label ?? ''} value={`${items[0]?.value ?? 0} kg/gal`} />
              ),
              pointerStripColor: '#9CA3AF',
              pointerStripWidth: 1,
              showPointerStrip: true,
            }}
          />
        </View>
      ) : (
        <EmptyChart message={records.length === 0 ? 'Sin datos en este período' : 'Se necesitan al menos 2 días con registros'} />
      )}
    </ScrollView>
  );
};
