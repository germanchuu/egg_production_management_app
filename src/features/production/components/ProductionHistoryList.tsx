/**
 * ProductionHistoryList Component
 *
 * Displays chronological production records with dates, eggs collected, and eggs per hen.
 * Shows production status indicators (optimal, low, warning).
 */

import React from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import { ProductionRecord } from '@/features/production/models/ProductionRecord';
import { ChickenLot } from '@/shared/types/entities';
import { ProductionRecordHelper } from '../models/ProductionRecord';
import { getProductionStatus } from '../utils/validation';
import { theme } from '@/core/theme';
import { Calendar, TrendingUp, TrendingDown, Egg } from 'lucide-react-native';

interface ProductionHistoryListProps {
  records: ProductionRecord[];
  lots: ChickenLot[];
  emptyMessage?: string;
}

export const ProductionHistoryList: React.FC<ProductionHistoryListProps> = ({
  records,
  lots,
  emptyMessage = 'No hay registros de producción',
}) => {
  const getLotName = (lotId: string) => {
    return lots.find((l) => l.id === lotId)?.name || 'Lote desconocido';
  };

  const getLot = (lotId: string) => {
    return lots.find((l) => l.id === lotId);
  };

  if (records.length === 0) {
    return (
      <View className="bg-white rounded-md px-xl py-2xl items-center border border-gray-200">
        <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-md">
          <Egg size={32} color={theme.colors.gray['400']} />
        </View>
        <Text className="text-textTertiary text-center">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-md border border-gray-200 overflow-hidden">
      {records.map((record, index) => {
        const lot = getLot(record.lotId);
        const status = lot
          ? getProductionStatus(record.eggsCollected, lot.liveHenCount)
          : null;

        const eggsPerHen = lot
          ? ProductionRecordHelper.calculateEggsPerHen(
              record.eggsCollected,
              lot.liveHenCount
            )
          : 0;

        const efficiency = ProductionRecordHelper.calculateEfficiency(eggsPerHen);

        return (
          <MotiView
            key={record.id}
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{
              type: 'timing',
              duration: 250,
              delay: index * 50,
            }}
          >
            <View
              className={`p-lg ${index !== 0 ? 'border-t border-gray-200' : ''}`}
            >
              {/* Header: Date and Lot */}
              <View className="flex-row items-center justify-between mb-sm">
                <View className="flex-row items-center gap-sm">
                  <Calendar size={16} color={theme.colors.gray['500']} />
                  <Text className="text-sm font-medium text-textSecondary">
                    {new Date(record.date).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <Text className="text-xs text-textTertiary">
                  {getLotName(record.lotId)}
                </Text>
              </View>

              {/* Main Content: Eggs and Efficiency */}
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-textPrimary">
                    {record.eggsCollected}
                  </Text>
                  <Text className="text-sm text-textSecondary mt-xs">
                    huevos recolectados
                  </Text>
                </View>

                <View className="items-end">
                  <View className="flex-row items-center gap-xs">
                    {status?.status === 'optimal' ? (
                      <TrendingUp size={16} color={theme.colors.success.DEFAULT} />
                    ) : status?.status === 'low' ? (
                      <TrendingDown size={16} color={theme.colors.warning.DEFAULT} />
                    ) : null}
                    <Text
                      className={`text-base font-semibold ${
                        status?.status === 'optimal'
                          ? 'text-success'
                          : status?.status === 'low'
                            ? 'text-warning'
                            : 'text-textPrimary'
                      }`}
                    >
                      {eggsPerHen.toFixed(2)}
                    </Text>
                    <Text className="text-sm text-textSecondary">
                      huevos/gallina
                    </Text>
                  </View>
                  <Text className="text-xs text-textTertiary mt-xs">
                    {efficiency}% eficiencia
                  </Text>
                </View>
              </View>

              {/* Status Badge */}
              {status && (
                <View className="mt-sm">
                  <View
                    className={`self-start px-sm py-xs rounded-sm ${
                      status.status === 'optimal'
                        ? 'bg-success/10'
                        : status.status === 'low'
                          ? 'bg-warning/10'
                          : status.status === 'warning'
                            ? 'bg-amber-50'
                            : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        status.status === 'optimal'
                          ? 'text-success'
                          : status.status === 'low'
                            ? 'text-warning'
                            : status.status === 'warning'
                              ? 'text-amber-700'
                              : 'text-textSecondary'
                      }`}
                    >
                      {status.status === 'optimal'
                        ? 'Óptima'
                        : status.status === 'low'
                          ? 'Baja'
                          : status.status === 'warning'
                            ? 'Verificar'
                            : 'Normal'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </MotiView>
        );
      })}
    </View>
  );
};
