import React, { useMemo } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Star, TrendingDown, BarChart3, Egg, Percent } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { ProductionRecord, ChickenLot } from '@/shared/types/entities';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ProductionSummaryTabProps {
  records: ProductionRecord[];
  lot: ChickenLot;
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

interface KpiRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

const KpiRow: React.FC<KpiRowProps> = ({ icon, label, value, sub }) => (
  <View className="flex-row items-center py-md border-b border-gray-50 gap-md">
    <View className="w-9 h-9 rounded-full bg-primary-50 items-center justify-center">{icon}</View>
    <View className="flex-1">
      <Text className="text-xs text-textSecondary">{label}</Text>
      {sub ? <Text className="text-xs text-textTertiary">{sub}</Text> : null}
    </View>
    <Text className="text-base font-bold text-textPrimary">{value}</Text>
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

export const ProductionSummaryTab: React.FC<ProductionSummaryTabProps> = ({ records, lot }) => {
  const henCount = lot.liveHenCount || lot.initialHenCount || 1;

  /** One entry per unique day */
  const dailyTotals = useMemo(() => aggregateByDay(records), [records]);

  const bestDay = useMemo(
    () => dailyTotals.reduce((best, d) => (d.total > best.total ? d : best), { date: '', total: 0 }),
    [dailyTotals]
  );

  const worstDay = useMemo(
    () => dailyTotals.reduce((worst, d) => (d.total < worst.total ? d : worst), dailyTotals[0] ?? { date: '', total: 0 }),
    [dailyTotals]
  );

  const totalEggs = useMemo(() => dailyTotals.reduce((s, d) => s + d.total, 0), [dailyTotals]);
  const uniqueDays = dailyTotals.length;
  const avgDaily = uniqueDays > 0 ? Math.round(totalEggs / uniqueDays) : 0;
  const avgEfficiency = uniqueDays > 0
    ? ((dailyTotals.reduce((s, d) => s + d.total / henCount, 0) / uniqueDays) * 100).toFixed(1)
    : '0';

  // Efficiency distribution — per unique day
  const effDist = useMemo(() => {
    let low = 0, optimal = 0, high = 0;
    dailyTotals.forEach((d) => {
      const eff = (d.total / henCount) * 100;
      if (eff < 70) low++;
      else if (eff <= 95) optimal++;
      else high++;
    });
    return { low, optimal, high };
  }, [dailyTotals, henCount]);

  const pieData = useMemo(() => {
    const total = effDist.low + effDist.optimal + effDist.high || 1;
    return [
      {
        value: Math.round((effDist.low / total) * 100),
        color: theme.colors.red['400'],
        text: effDist.low > 0 ? `${Math.round((effDist.low / total) * 100)}%` : '',
        label: 'Baja (<70%)',
      },
      {
        value: Math.round((effDist.optimal / total) * 100),
        color: theme.colors.primary['500'],
        text: effDist.optimal > 0 ? `${Math.round((effDist.optimal / total) * 100)}%` : '',
        label: 'Óptima (70-95%)',
      },
      {
        value: Math.round((effDist.high / total) * 100),
        color: theme.colors.green ? theme.colors.green['500'] : '#22C55E',
        text: effDist.high > 0 ? `${Math.round((effDist.high / total) * 100)}%` : '',
        label: 'Alta (>95%)',
      },
    ].filter((d) => d.value > 0);
  }, [effDist]);

  if (records.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-xl">
        <Egg size={48} color={theme.colors.gray['300']} />
        <Text className="text-textTertiary text-center mt-md">Sin datos en este período</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* KPIs */}
      <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wide mb-sm">
        Indicadores clave
      </Text>
      <View className="bg-white rounded-md border border-gray-100 shadow-sm px-md mb-lg">
        <KpiRow
          icon={<Star size={18} color={theme.colors.accent['500']} />}
          label="Mejor día"
          value={String(bestDay.total)}
          sub={fmtDate(bestDay.date)}
        />
        <KpiRow
          icon={<TrendingDown size={18} color={theme.colors.red['400']} />}
          label="Peor día"
          value={String(worstDay.total)}
          sub={fmtDate(worstDay.date)}
        />
        <KpiRow
          icon={<BarChart3 size={18} color={theme.colors.primary['600']} />}
          label="Promedio diario"
          value={`${avgDaily} huevos`}
        />
        <KpiRow
          icon={<Egg size={18} color={theme.colors.secondary['600']} />}
          label="Total acumulado"
          value={totalEggs.toLocaleString('es-ES')}
          sub="huevos en el período"
        />
        <KpiRow
          icon={<Percent size={18} color={theme.colors.primary['500']} />}
          label="Eficiencia promedio"
          value={`${avgEfficiency}%`}
          sub="huevos/gallina × 100"
        />
      </View>

      {/* Distribución eficiencia */}
      <Text className="text-sm font-semibold text-textPrimary mb-sm">Distribución de eficiencia</Text>
      {pieData.length > 0 ? (
        <View className="bg-white rounded-md border border-gray-100 shadow-sm p-md mb-lg items-center">
          <PieChart
            data={pieData}
            radius={Math.min(100, (SCREEN_WIDTH - 96) / 2)}
            textSize={11}
            textColor="#ffffff"
            showText
            isAnimated
          />
          <View className="flex-row flex-wrap gap-md mt-md justify-center">
            {pieData.map((d) => (
              <View key={d.label} className="flex-row items-center gap-xs">
                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <Text className="text-xs text-textSecondary">{d.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View className="bg-gray-50 rounded-md border border-gray-100 items-center justify-center py-xl">
          <Text className="text-textTertiary text-sm">Sin datos suficientes</Text>
        </View>
      )}
    </ScrollView>
  );
};
