import React, { useMemo } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { Wheat, Package } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { FeedBatchWithRemaining, FeedingRecordWithMetrics } from '@/features/feeding/services/FeedingService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 48;

const PIE_COLORS = [
  theme.colors.primary['500'],
  theme.colors.secondary['500'],
  '#F59E0B',
  '#10B981',
  '#8B5CF6',
  '#EF4444',
  '#06B6D4',
];

interface FeedBatchAnalyticsTabProps {
  feedingHistory: FeedingRecordWithMetrics[];
  feedBatches: FeedBatchWithRemaining[];
}

interface BatchSummary {
  batchId: string;
  batchName: string;
  totalKgUsed: number;
  quantityKg: number;
  remainingKg: number;
  pctUsed: number;
}

export const FeedBatchAnalyticsTab: React.FC<FeedBatchAnalyticsTabProps> = ({
  feedingHistory,
  feedBatches,
}) => {
  const batchSummaries = useMemo<BatchSummary[]>(() => {
    const usageMap = new Map<string, number>();
    feedingHistory.forEach((r) => {
      usageMap.set(r.feedBatchId, (usageMap.get(r.feedBatchId) ?? 0) + r.quantityFedKg);
    });

    return feedBatches
      .filter((b) => usageMap.has(b.id))
      .map((b) => {
        const used = usageMap.get(b.id) ?? 0;
        return {
          batchId: b.id,
          batchName: b.batchName,
          totalKgUsed: used,
          quantityKg: b.quantityKg,
          remainingKg: b.remainingQuantityKg,
          pctUsed: b.quantityKg > 0 ? (used / b.quantityKg) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalKgUsed - a.totalKgUsed);
  }, [feedingHistory, feedBatches]);

  const totalUsed = useMemo(
    () => batchSummaries.reduce((s, b) => s + b.totalKgUsed, 0),
    [batchSummaries]
  );

  const barData = useMemo(
    () =>
      batchSummaries.map((b, i) => ({
        value: parseFloat(b.totalKgUsed.toFixed(1)),
        label: b.batchName.slice(0, 8),
        frontColor: PIE_COLORS[i % PIE_COLORS.length],
      })),
    [batchSummaries]
  );

  const pieData = useMemo(
    () =>
      batchSummaries.map((b, i) => {
        const pct = (b.totalKgUsed / (totalUsed || 1)) * 100;
        return {
          value: parseFloat(pct.toFixed(1)),
          color: PIE_COLORS[i % PIE_COLORS.length],
          text: batchSummaries.length <= 5 ? `${Math.round(pct)}%` : '',
          label: b.batchName,
        };
      }),
    [batchSummaries, totalUsed]
  );

  if (batchSummaries.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-xl">
        <Package size={48} color={theme.colors.gray['300']} />
        <Text className="text-textTertiary text-center mt-md">Sin lotes de alimento en este período</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* Consumo por lote */}
      <Text className="text-sm font-semibold text-textPrimary mb-sm">Consumo por lote (kg)</Text>
      <View className="bg-white rounded-md border border-gray-100 p-md mb-lg overflow-hidden">
        <BarChart
          data={barData}
          width={CHART_WIDTH - 32}
          height={180}
          barWidth={Math.max(20, Math.min(40, Math.floor((CHART_WIDTH - 80) / (barData.length || 1))))}
          spacing={8}
          roundedTop
          noOfSections={4}
          xAxisLabelTextStyle={{ fontSize: 9, color: theme.colors.gray['500'] }}
          yAxisTextStyle={{ fontSize: 10, color: theme.colors.gray['500'] }}
          isAnimated
        />
      </View>

      {/* Distribución */}
      {pieData.length > 1 && (
        <>
          <Text className="text-sm font-semibold text-textPrimary mb-sm">Distribución de uso</Text>
          <View className="bg-white rounded-md border border-gray-100 p-md mb-lg items-center">
            <PieChart
              data={pieData}
              radius={Math.min(90, (SCREEN_WIDTH - 96) / 2)}
              textSize={11}
              textColor="#ffffff"
              showText
              isAnimated
            />
            <View className="flex-row flex-wrap gap-md mt-md justify-center">
              {pieData.map((d, i) => (
                <View key={i} className="flex-row items-center gap-xs">
                  <View className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <Text className="text-xs text-textSecondary" numberOfLines={1}>{d.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Lista detallada */}
      <Text className="text-sm font-semibold text-textPrimary mb-sm">Detalle por lote</Text>
      <View className="gap-sm">
        {batchSummaries.map((b, i) => (
          <View key={b.batchId} className="bg-white rounded-md border border-gray-100 shadow-sm p-md">
            <View className="flex-row items-center gap-sm mb-sm">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] + '20' }}
              >
                <Wheat size={16} color={PIE_COLORS[i % PIE_COLORS.length]} />
              </View>
              <Text className="text-sm font-semibold text-textPrimary flex-1" numberOfLines={1}>
                {b.batchName}
              </Text>
              <Text className="text-xs text-textSecondary">{b.pctUsed.toFixed(0)}% agotado</Text>
            </View>

            {/* Progress bar */}
            <View className="h-1.5 bg-gray-100 rounded-full mb-sm overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, b.pctUsed)}%`,
                  backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                }}
              />
            </View>

            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-xs text-textTertiary">Preparado</Text>
                <Text className="text-sm font-semibold text-textPrimary">{b.quantityKg.toFixed(1)} kg</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-xs text-textTertiary">Usado</Text>
                <Text className="text-sm font-semibold text-textPrimary">{b.totalKgUsed.toFixed(1)} kg</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-xs text-textTertiary">Restante</Text>
                <Text className="text-sm font-semibold text-textPrimary">{b.remainingKg.toFixed(1)} kg</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
