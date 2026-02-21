import React, { useMemo } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { theme } from '@/core/theme';
import { ProductionRecord, ChickenLot } from '@/shared/types/entities';
import { ChartTooltip } from '@/shared/components/ChartTooltip';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 48;

interface ProductionTrendsTabProps {
  records: ProductionRecord[];
  lot: ChickenLot;
}

function fmtDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

function getISOWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function fmtWeekKey(key: string): string {
  return `S${key.split('-W')[1]}`;
}

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <View className="bg-gray-50 rounded-md border border-gray-100 items-center justify-center py-xl">
    <Text className="text-textTertiary text-sm">{message}</Text>
  </View>
);

/** Aggregate records into daily totals, sorted ascending. */
function aggregateByDay(records: ProductionRecord[]): { date: string; total: number }[] {
  const map = new Map<string, number>();
  records.forEach((r) => {
    map.set(r.date, (map.get(r.date) ?? 0) + r.eggsCollected);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));
}

export const ProductionTrendsTab: React.FC<ProductionTrendsTabProps> = ({ records, lot }) => {
  const henCount = lot.liveHenCount || lot.initialHenCount || 1;

  /** One entry per unique day */
  const dailyTotals = useMemo(() => aggregateByDay(records), [records]);

  const eggsPerHenData = useMemo(
    () =>
      dailyTotals.map((d) => ({
        value: parseFloat((d.total / henCount).toFixed(3)),
        label: fmtDate(d.date),
        dataPointColor: theme.colors.primary['600'],
      })),
    [dailyTotals, henCount]
  );

  const dailyTotalData = useMemo(
    () =>
      dailyTotals.map((d) => ({
        value: d.total,
        label: fmtDate(d.date),
        frontColor: theme.colors.primary['500'],
      })),
    [dailyTotals]
  );

  const weeklyData = useMemo(() => {
    const map = new Map<string, { total: number; weekStart: string }>();
    dailyTotals.forEach((d) => {
      const key = getISOWeekKey(d.date);
      const prev = map.get(key);
      if (!prev) {
        map.set(key, { total: d.total, weekStart: d.date });
      } else {
        map.set(key, { total: prev.total + d.total, weekStart: prev.weekStart });
      }
    });
    return Array.from(map.entries())
      .sort(([, a], [, b]) => a.weekStart.localeCompare(b.weekStart))
      .map(([key, { total }]) => ({
        value: total,
        label: fmtWeekKey(key),
        frontColor: theme.colors.secondary['500'],
      }));
  }, [dailyTotals]);

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* Huevos/gallina/día */}
      <Text className="text-sm font-semibold text-textPrimary mb-sm">Huevos / gallina / día</Text>
      {eggsPerHenData.length > 1 ? (
        <View className="bg-white rounded-md border border-gray-100 p-md mb-lg overflow-hidden">
          <LineChart
            data={eggsPerHenData}
            width={CHART_WIDTH - 32}
            height={180}
            color={theme.colors.primary['600']}
            thickness={2}
            noOfSections={5}
            xAxisLabelTextStyle={{ fontSize: 9, color: theme.colors.gray['500'] }}
            yAxisTextStyle={{ fontSize: 10, color: theme.colors.gray['500'] }}
            hideDataPoints={eggsPerHenData.length > 30}
            isAnimated
            pointerConfig={{
              activatePointersInstantlyOnTouch: true,
              autoAdjustPointerLabelPosition: true,
              persistPointer: false,
              pointerLabelComponent: (items: Array<{ label?: string; value?: number }>) => (
                <ChartTooltip label={items[0]?.label ?? ''} value={`${items[0]?.value ?? 0} huevos/gallina`} />
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

      {/* Producción total diaria */}
      <Text className="text-sm font-semibold text-textPrimary mb-sm">Producción total diaria (huevos)</Text>
      {dailyTotalData.length > 0 ? (
        <View className="bg-white rounded-md border border-gray-100 p-md mb-lg overflow-hidden">
          <BarChart
            data={dailyTotalData}
            width={CHART_WIDTH - 32}
            height={180}
            barWidth={Math.max(8, Math.min(24, Math.floor((CHART_WIDTH - 80) / (dailyTotalData.length || 1))))}
            spacing={4}
            roundedTop
            noOfSections={4}
            xAxisLabelTextStyle={{ fontSize: 9, color: theme.colors.gray['500'] }}
            yAxisTextStyle={{ fontSize: 10, color: theme.colors.gray['500'] }}
            isAnimated
            focusBarOnPress
            autoCenterTooltip
            renderTooltip={(item: { label?: string; value?: number }) => (
              <ChartTooltip label={item.label ?? ''} value={`${item.value ?? 0} huevos`} />
            )}
          />
        </View>
      ) : (
        <EmptyChart message="Sin datos en este período" />
      )}

      {/* Producción semanal */}
      {weeklyData.length > 0 && (
        <>
          <Text className="text-sm font-semibold text-textPrimary mb-sm">Producción semanal (huevos)</Text>
          <View className="bg-white rounded-md border border-gray-100 p-md mb-lg overflow-hidden">
            <BarChart
              data={weeklyData}
              width={CHART_WIDTH - 32}
              height={160}
              barWidth={Math.max(20, Math.min(40, Math.floor((CHART_WIDTH - 80) / (weeklyData.length || 1))))}
              spacing={8}
              roundedTop
              noOfSections={4}
              xAxisLabelTextStyle={{ fontSize: 9, color: theme.colors.gray['500'] }}
              yAxisTextStyle={{ fontSize: 10, color: theme.colors.gray['500'] }}
              isAnimated
              focusBarOnPress
              autoCenterTooltip
              renderTooltip={(item: { label?: string; value?: number }) => (
                <ChartTooltip label={item.label ?? ''} value={`${item.value ?? 0} huevos`} />
              )}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
};
