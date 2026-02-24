/**
 * MortalityHistoryList Component
 *
 * Displays chronological mortality records grouped by day.
 * Shows daily totals and individual mortality records with timestamps.
 * Includes edit buttons for each record.
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { MortalityRecord } from '@/shared/types/entities';
import { ChickenLot } from '@/shared/types/entities';
import { theme } from '@/core/theme';
import { Calendar, AlertTriangle, Skull, Pencil } from 'lucide-react-native';

interface MortalityHistoryListProps {
  records: MortalityRecord[];
  lots: ChickenLot[];
  emptyMessage?: string;
}

export const MortalityHistoryList: React.FC<MortalityHistoryListProps> = ({
  records,
  lots,
  emptyMessage = 'No hay registros de mortalidad',
}) => {
  const router = useRouter();

  const getLotName = (lotId: string) => {
    return lots.find((l) => l.id === lotId)?.name || 'Lote desconocido';
  };

  const getLot = (lotId: string) => {
    return lots.find((l) => l.id === lotId);
  };

  // Group records by day
  const groupedRecords = useMemo(() => {
    const groups = new Map<string, MortalityRecord[]>();

    records.forEach((record) => {
      const dateKey = record.date.split('T')[0];
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(record);
    });

    // Sort groups by date descending
    return new Map(
      Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))
    );
  }, [records]);

  if (records.length === 0) {
    return (
      <View className="bg-white rounded-md px-xl py-2xl items-center border border-gray-200">
        <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-md">
          <Skull size={32} color={theme.colors.gray['400']} />
        </View>
        <Text className="text-textTertiary text-center">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-md border border-gray-200 overflow-hidden">
      {Array.from(groupedRecords.entries()).map(([dateKey, dayRecords], groupIndex) => {
        const dailyTotal = dayRecords.reduce((sum, r) => sum + r.hensDied, 0);
        const lot = getLot(dayRecords[0].lotId);
        const isHighMortality =
          lot && dailyTotal > 0 ? (dailyTotal / lot.liveHenCount) * 100 > 10 : false;

        return (
          <MotiView
            key={dateKey}
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{
              type: 'timing',
              duration: 250,
              delay: groupIndex * 50,
            }}
          >
            {/* Daily Total Header */}
            <View
              className={`${isHighMortality ? 'bg-error-50' : 'bg-gray-50'} px-lg py-md ${groupIndex !== 0 ? 'border-t border-gray-200' : ''}`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-sm flex-1">
                  <Calendar
                    size={16}
                    color={
                      isHighMortality
                        ? theme.colors.error.DEFAULT
                        : theme.colors.gray['600']
                    }
                  />
                  <Text
                    className={`text-sm font-semibold ${isHighMortality ? 'text-error' : 'text-gray-700'}`}
                  >
                    {new Date(dateKey).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <Text
                  className={`text-xs ${isHighMortality ? 'text-error-700' : 'text-gray-600'}`}
                >
                  {getLotName(dayRecords[0].lotId)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between mt-xs">
                <Text
                  className={`text-xs ${isHighMortality ? 'text-error-700' : 'text-gray-600'}`}
                >
                  Total: {dailyTotal} gallina{dailyTotal !== 1 ? 's' : ''}
                  {dayRecords.length > 1 && ` (${dayRecords.length} registros)`}
                </Text>
                {lot && (
                  <View className="flex-row items-center gap-xs">
                    {isHighMortality && (
                      <AlertTriangle size={14} color={theme.colors.error.DEFAULT} />
                    )}
                    <Text
                      className={`text-xs ${isHighMortality ? 'text-error-700' : 'text-gray-600'}`}
                    >
                      {((dailyTotal / lot.liveHenCount) * 100).toFixed(1)}% mortalidad
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Individual Records */}
            {dayRecords.map((record, index) => (
              <View
                key={record.id}
                className={`px-lg py-md flex-row justify-between items-center ${
                  index !== dayRecords.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <View className="flex-1">
                  <Text className="text-sm text-textSecondary">
                    {new Date(record.createdAt).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text className="text-base font-medium text-textPrimary mt-xs">
                    {record.hensDied} gallina{record.hensDied !== 1 ? 's' : ''}
                  </Text>
                </View>

                {/* Edit Button */}
                <TouchableOpacity
                  onPress={() => router.push(`/mortality/${record.id}/edit` as any)}
                  className="ml-md p-sm"
                >
                  <Pencil size={20} color={theme.colors.primary['500']} />
                </TouchableOpacity>
              </View>
            ))}
          </MotiView>
        );
      })}
    </View>
  );
};
