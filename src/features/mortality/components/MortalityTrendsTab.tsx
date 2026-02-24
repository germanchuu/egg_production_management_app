import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { Skull, TrendingDown, Calendar, Activity } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { MortalityRecord, ChickenLot } from '@/shared/types/entities';
import { ChartTooltip } from '@/shared/components/ChartTooltip';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 48;

interface MortalityTrendsTabProps {
  records: MortalityRecord[];
  lot: ChickenLot;
}

function fmtDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

function fmtMonth(dateStr: string): string {
  const [y, m] = dateStr.split('-');
  return `${m}/${y.slice(2)}`;
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

/** Aggregate individual records into daily totals, sorted ascending by date. */
function aggregateByDay(records: MortalityRecord[]): { date: string; total: number }[] {
  const map = new Map<string, number>();
  records.forEach((r) => {
    map.set(r.date, (map.get(r.date) ?? 0) + r.hensDied);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));
}

export const MortalityTrendsTab: React.FC<MortalityTrendsTabProps> = ({ records, lot }) => {
  const [selectedDailyBar, setSelectedDailyBar] = useState<{ label: string; value: number } | null>(null);
  const [selectedMonthlyBar, setSelectedMonthlyBar] = useState<{ label: string; value: number } | null>(null);

  /** One entry per unique day, summing all records that day */
  const dailyTotals = useMemo(() => aggregateByDay(records), [records]);

  const barData = useMemo(
    () =>
      dailyTotals.map((d) => ({
        value: d.total,
        label: fmtDate(d.date),
        frontColor: theme.colors.red['500'],
      })),
    [dailyTotals]
  );

  const cumulativeData = useMemo(
    () =>
      dailyTotals.reduce<{ value: number; label: string; dataPointColor: string }[]>((acc, d) => {
        const prev = acc.length > 0 ? acc[acc.length - 1].value : 0;
        acc.push({ value: prev + d.total, label: fmtDate(d.date), dataPointColor: theme.colors.red['600'] });
        return acc;
      }, []),
    [dailyTotals]
  );

  const monthlyData = useMemo(() => {
    const map = new Map<string, number>();
    dailyTotals.forEach((d) => {
      const key = d.date.slice(0, 7); // YYYY-MM
      map.set(key, (map.get(key) ?? 0) + d.total);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        value: parseFloat(((total / (lot.initialHenCount || 1)) * 100).toFixed(2)),
        label: fmtMonth(month),
        frontColor: theme.colors.orange['500'],
      }));
  }, [dailyTotals, lot.initialHenCount]);

  // KPIs — all based on daily totals
  const totalDied = useMemo(() => dailyTotals.reduce((s, d) => s + d.total, 0), [dailyTotals]);
  const maxDay = useMemo(
    () => dailyTotals.reduce((best, d) => (d.total > best.total ? d : best), { date: '', total: 0 }),
    [dailyTotals]
  );
  const uniqueDays = dailyTotals.length;
  const avgPerDay = uniqueDays > 0 ? (totalDied / uniqueDays).toFixed(1) : '0';
  const mortalityRate = ((totalDied / (lot.initialHenCount || 1)) * 100).toFixed(2);

  const primaryRed = theme.colors.red['500'];
  const primaryOrange = theme.colors.orange['500'];

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* KPIs */}
      <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wide mb-sm">
        Resumen del período
      </Text>
      <View className="flex-row gap-sm mb-sm">
        <KpiCard
          icon={<Skull size={14} color={primaryRed} />}
          label="Total bajas"
          value={totalDied.toLocaleString('es-ES')}
          sub="en el período"
          color={theme.colors.red['500']}
        />
        <KpiCard
          icon={<TrendingDown size={14} color={primaryOrange} />}
          label="Tasa mortalidad"
          value={`${mortalityRate}%`}
          sub="del lote inicial"
          color={theme.colors.orange['500']}
        />
      </View>
      <View className="flex-row gap-sm mb-lg">
        <KpiCard
          icon={<Activity size={14} color={primaryRed} />}
          label="Promedio/día"
          value={avgPerDay}
          sub="bajas por día"
          color={theme.colors.red['500']}
        />
        <KpiCard
          icon={<Calendar size={14} color={primaryOrange} />}
          label="Peor día"
          value={maxDay.total > 0 ? String(maxDay.total) : '—'}
          sub={maxDay.date ? fmtDate(maxDay.date) : 'sin datos'}
          color={theme.colors.orange['500']}
        />
      </View>

      {/* Bajas por día */}
      <Text className="text-sm font-semibold text-textPrimary mb-sm">Bajas por día</Text>
      {barData.length > 0 ? (
        <View className="bg-white rounded-md border border-gray-100 p-md mb-lg">
          <BarChart
            data={barData.map((d) => ({
              ...d,
              onPress: () =>
                setSelectedDailyBar((prev) => (prev?.label === d.label ? null : { label: d.label, value: d.value })),
            }))}
            width={CHART_WIDTH - 32}
            height={180}
            barWidth={Math.max(8, Math.min(24, Math.floor((CHART_WIDTH - 80) / (barData.length || 1))))}
            spacing={4}
            roundedTop
            noOfSections={4}
            yAxisLabelSuffix=""
            xAxisLabelTextStyle={{ fontSize: 9, color: theme.colors.gray['500'] }}
            yAxisTextStyle={{ fontSize: 10, color: theme.colors.gray['500'] }}
            isAnimated
            focusBarOnPress
          />
          {selectedDailyBar && (
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <ChartTooltip label={selectedDailyBar.label} value={`${selectedDailyBar.value} bajas`} />
            </View>
          )}
        </View>
      ) : (
        <EmptyChart message="Sin datos en este período" />
      )}

      {/* Mortalidad acumulada */}
      <Text className="text-sm font-semibold text-textPrimary mb-sm">Mortalidad acumulada</Text>
      {cumulativeData.length > 1 ? (
        <View className="bg-white rounded-md border border-gray-100 p-md mb-lg">
          <LineChart
            data={cumulativeData}
            width={CHART_WIDTH - 32}
            height={180}
            areaChart
            color={theme.colors.red['500']}
            startFillColor={theme.colors.red['200']}
            endFillColor={theme.colors.red['50']}
            thickness={2}
            noOfSections={4}
            xAxisLabelTextStyle={{ fontSize: 9, color: theme.colors.gray['500'] }}
            yAxisTextStyle={{ fontSize: 10, color: theme.colors.gray['500'] }}
            hideDataPoints={cumulativeData.length > 30}
            isAnimated
            pointerConfig={{
              activatePointersInstantlyOnTouch: true,
              autoAdjustPointerLabelPosition: true,
              persistPointer: false,
              pointerLabelHeight: 50,
              pointerLabelWidth: 120,
              pointerLabelComponent: (items: Array<{ label?: string; value?: number }>) => (
                <ChartTooltip label={items[0]?.label ?? ''} value={`${items[0]?.value ?? 0} acumuladas`} />
              ),
              pointerStripColor: '#9CA3AF',
              pointerStripWidth: 1,
              showPointerStrip: true,
            }}
          />
        </View>
      ) : (
        <EmptyChart message="Se necesitan al menos 2 días con registros" />
      )}

      {/* Tasa mensual */}
      {monthlyData.length > 0 && (
        <>
          <Text className="text-sm font-semibold text-textPrimary mb-sm">Tasa de mortalidad mensual (%)</Text>
          <View className="bg-white rounded-md border border-gray-100 p-md mb-lg">
            <BarChart
              data={monthlyData.map((d) => ({
                ...d,
                onPress: () =>
                  setSelectedMonthlyBar((prev) => (prev?.label === d.label ? null : { label: d.label, value: d.value })),
              }))}
              width={CHART_WIDTH - 32}
              height={160}
              barWidth={Math.max(20, Math.min(40, Math.floor((CHART_WIDTH - 80) / (monthlyData.length || 1))))}
              spacing={8}
              roundedTop
              noOfSections={4}
              yAxisLabelSuffix="%"
              xAxisLabelTextStyle={{ fontSize: 9, color: theme.colors.gray['500'] }}
              yAxisTextStyle={{ fontSize: 10, color: theme.colors.gray['500'] }}
              isAnimated
              focusBarOnPress
            />
            {selectedMonthlyBar && (
              <View style={{ alignItems: 'center', marginTop: 8 }}>
                <ChartTooltip label={selectedMonthlyBar.label} value={`${selectedMonthlyBar.value}%`} />
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};
