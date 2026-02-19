/**
 * FeedingHistoryList Component (T126)
 *
 * Displays feeding records grouped by date, showing:
 * - Date header with daily total
 * - Individual records with batch name, quantity, feed per hen
 * Follows FRONTEND.md: MotiView entrance, rounded-md cards,
 * lucide icons, semantic colors.
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import { Calendar, Wheat, Scale, Package } from 'lucide-react-native';
import { FeedingRecord } from '@/shared/types/entities';
import { FeedBatchWithRemaining } from '../services/FeedingService';
import { theme } from '@/core/theme';

interface FeedingHistoryListProps {
  records: FeedingRecord[];
  feedBatches: FeedBatchWithRemaining[];
  /** Optional: live hen count to show feed/hen ratio per record */
  liveHenCount?: number;
  emptyMessage?: string;
}

export const FeedingHistoryList: React.FC<FeedingHistoryListProps> = ({
  records,
  feedBatches,
  liveHenCount,
  emptyMessage = 'No hay registros de alimentación',
}) => {
  const getBatchName = (feedBatchId: string) =>
    feedBatches.find((b) => b.id === feedBatchId)?.batchName ?? 'Lote desconocido';

  // Group records by day, sorted descending
  const groupedRecords = useMemo(() => {
    const groups = new Map<string, FeedingRecord[]>();

    records.forEach((record) => {
      const dateKey = record.date.split('T')[0];
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(record);
    });

    return new Map(
      Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))
    );
  }, [records]);

  // Empty state
  if (records.length === 0) {
    return (
      <View className="bg-white rounded-md border border-gray-200 px-xl py-2xl items-center">
        <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-md">
          <Wheat size={32} color={theme.colors.gray['400']} />
        </View>
        <Text className="text-textTertiary text-center">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View className="gap-md">
      {Array.from(groupedRecords.entries()).map(
        ([dateKey, dayRecords], groupIndex) => {
          const dailyTotal = dayRecords.reduce(
            (sum, r) => sum + r.quantityFedKg,
            0
          );
          const feedPerHenDay =
            liveHenCount && liveHenCount > 0
              ? dailyTotal / liveHenCount
              : null;

          return (
            <MotiView
              key={dateKey}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: 250,
                delay: groupIndex * 50,
              }}
            >
              <View className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
                {/* Day header */}
                <View className="bg-primary-50 px-lg py-md border-b border-primary-100">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-sm flex-1">
                      <Calendar size={16} color={theme.colors.primary['600']} />
                      <Text className="text-sm font-semibold text-primary-700">
                        {new Date(dateKey + 'T12:00:00').toLocaleDateString(
                          'es-ES',
                          {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          }
                        )}
                      </Text>
                    </View>
                    {dayRecords.length > 1 && (
                      <Text className="text-xs text-primary-500">
                        {dayRecords.length} registros
                      </Text>
                    )}
                  </View>
                  <View className="flex-row items-center justify-between mt-xs">
                    <View className="flex-row items-center gap-xs">
                      <Scale size={14} color={theme.colors.primary['500']} />
                      <Text className="text-xs text-primary-600">
                        Total: {dailyTotal.toFixed(2)} kg
                      </Text>
                    </View>
                    {feedPerHenDay !== null && (
                      <Text className="text-xs text-primary-500">
                        {feedPerHenDay.toFixed(4)} kg/gallina
                      </Text>
                    )}
                  </View>
                </View>

                {/* Individual records */}
                {dayRecords.map((record, index) => {
                  const feedPerHen =
                    liveHenCount && liveHenCount > 0
                      ? (record.quantityFedKg / liveHenCount).toFixed(4)
                      : null;

                  return (
                    <View
                      key={record.id}
                      className={`px-lg py-md flex-row items-center gap-md ${
                        index !== dayRecords.length - 1
                          ? 'border-b border-gray-100'
                          : ''
                      }`}
                    >
                      {/* Batch icon */}
                      <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
                        <Package
                          size={16}
                          color={theme.colors.gray['500']}
                        />
                      </View>

                      {/* Content */}
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-textPrimary">
                          {getBatchName(record.feedBatchId)}
                        </Text>
                        <Text className="text-xs text-textSecondary mt-xs">
                          {record.quantityFedKg.toFixed(2)} kg suministrados
                          {feedPerHen !== null && ` · ${feedPerHen} kg/gallina`}
                        </Text>
                      </View>

                      {/* Time */}
                      <Text className="text-xs text-textTertiary">
                        {new Date(record.createdAt).toLocaleTimeString(
                          'es-ES',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </MotiView>
          );
        }
      )}
    </View>
  );
};
