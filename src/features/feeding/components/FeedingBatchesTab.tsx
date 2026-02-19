import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { Package, Plus, ChevronDown, ChevronUp } from 'lucide-react-native';
import { FeedBatchWithRemaining } from '../services/FeedingService';
import { FeedBatchForm } from './FeedBatchForm';
import { FeedBatchFormData } from '../utils/validation';
import { theme } from '@/core/theme';

interface FeedingBatchesTabProps {
  batches: FeedBatchWithRemaining[];
  isSubmitting: boolean;
  onCreateBatch: (data: FeedBatchFormData) => Promise<void>;
}

export const FeedingBatchesTab: React.FC<FeedingBatchesTabProps> = ({
  batches,
  isSubmitting,
  onCreateBatch,
}) => {
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data: FeedBatchFormData) => {
    await onCreateBatch(data);
    setShowForm(false);
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="px-lg py-md gap-md">
        {/* Toggle form button */}
        <Pressable
          className="bg-white rounded-md border border-primary-200 p-md flex-row items-center justify-between"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onPress={() => setShowForm((v) => !v)}
        >
          <View className="flex-row items-center gap-sm">
            <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center">
              <Plus size={16} color={theme.colors.primary['600']} />
            </View>
            <Text className="text-base font-medium text-primary-700">
              Registrar nuevo lote de alimento
            </Text>
          </View>
          {showForm ? (
            <ChevronUp size={20} color={theme.colors.primary['500']} />
          ) : (
            <ChevronDown size={20} color={theme.colors.primary['500']} />
          )}
        </Pressable>

        {/* Collapsible form */}
        {showForm && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 250 }}
            className="bg-white rounded-md border border-gray-200 shadow-sm p-lg"
          >
            <Text className="text-base font-semibold text-textPrimary mb-md">
              Nuevo Lote de Alimento
            </Text>
            <FeedBatchForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              isSubmitting={isSubmitting}
            />
          </MotiView>
        )}

        {/* Batch list */}
        <View>
          <Text className="text-lg font-bold text-textPrimary mb-md">Lotes Registrados</Text>

          {batches.length === 0 ? (
            <View className="bg-white rounded-md border border-gray-200 px-xl py-2xl items-center">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-md">
                <Package size={32} color={theme.colors.gray['400']} />
              </View>
              <Text className="text-base font-semibold text-textPrimary text-center">
                Sin lotes de alimento
              </Text>
              <Text className="text-sm text-textSecondary text-center mt-xs">
                Registra el primer lote usando el botón de arriba
              </Text>
            </View>
          ) : (
            <View className="gap-md">
              {batches.map((batch, index) => (
                <FeedBatchCard key={batch.id} batch={batch} index={index} />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

// ─── FeedBatchCard ──────────────────────────────────────────────────────────

interface FeedBatchCardProps {
  batch: FeedBatchWithRemaining;
  index: number;
}

const FeedBatchCard: React.FC<FeedBatchCardProps> = ({ batch, index }) => {
  const usedKg = batch.quantityKg - batch.remainingQuantityKg;
  const usedPct = batch.quantityKg > 0 ? (usedKg / batch.quantityKg) * 100 : 0;
  const isExhausted = batch.remainingQuantityKg <= 0;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 250, delay: index * 50 }}
    >
      <View
        className={`bg-white rounded-md border shadow-sm p-md ${
          isExhausted ? 'border-gray-200 opacity-60' : 'border-gray-100'
        }`}
      >
        {/* Header */}
        <View className="flex-row items-center gap-md mb-md">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isExhausted ? 'bg-gray-100' : 'bg-primary-100'
            }`}
          >
            <Package
              size={20}
              color={isExhausted ? theme.colors.gray['400'] : theme.colors.primary['600']}
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-textPrimary">{batch.batchName}</Text>
            <Text className="text-xs text-textSecondary mt-xs">
              Preparado:{' '}
              {new Date(batch.preparationDate + 'T12:00:00').toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          {isExhausted && (
            <View className="bg-gray-100 px-sm py-xs rounded-full">
              <Text className="text-xs text-textTertiary font-medium">Agotado</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row gap-md mb-md">
          <StatCell label="Total" value={batch.quantityKg.toFixed(2)} />
          <StatCell label="Usado" value={usedKg.toFixed(2)} muted />
          <StatCell
            label="Disponible"
            value={batch.remainingQuantityKg.toFixed(2)}
            highlighted={!isExhausted}
          />
        </View>

        {/* Progress bar */}
        <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${isExhausted ? 'bg-gray-400' : 'bg-primary-500'}`}
            style={{ width: `${Math.min(100, usedPct)}%` }}
          />
        </View>
        <Text className="text-xs text-textTertiary mt-xs text-right">
          {usedPct.toFixed(1)}% utilizado
        </Text>
      </View>
    </MotiView>
  );
};

// ─── StatCell ───────────────────────────────────────────────────────────────

interface StatCellProps {
  label: string;
  value: string;
  muted?: boolean;
  highlighted?: boolean;
}

const StatCell: React.FC<StatCellProps> = ({ label, value, muted, highlighted }) => (
  <View
    className={`flex-1 rounded-md p-sm items-center ${
      highlighted ? 'bg-primary-50' : 'bg-gray-50'
    }`}
  >
    <Text className="text-xs text-textTertiary mb-xs">{label}</Text>
    <Text
      className={`text-base font-bold ${
        highlighted ? 'text-primary-700' : muted ? 'text-textSecondary' : 'text-textPrimary'
      }`}
    >
      {value}
    </Text>
    <Text className="text-xs text-textTertiary">kg</Text>
  </View>
);
