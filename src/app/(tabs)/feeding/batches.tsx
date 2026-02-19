/**
 * Feed Batches Screen (T127)
 *
 * Manage feed batches: view existing batches with remaining quantity,
 * and register new ones via the FeedBatchForm.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { MotiView } from 'moti';
import { Package, Plus, Scale, ChevronDown, ChevronUp } from 'lucide-react-native';
import { FeedingServiceProvider } from '@/features/feeding/services/FeedingServiceProvider';
import { FeedBatchForm } from '@/features/feeding/components/FeedBatchForm';
import { FeedBatchWithRemaining } from '@/features/feeding/services/FeedingService';
import { FeedBatchFormData } from '@/features/feeding/utils/validation';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { useSyncRefresh } from '@/shared/contexts/SyncContext';
import { theme } from '@/core/theme';

export default function FeedBatchesScreen() {
  const { user } = useAuth();
  const { success, error } = useToastContext();

  const [batches, setBatches] = useState<FeedBatchWithRemaining[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const service = await FeedingServiceProvider.getFeedingService();
      const result = await service.listFeedBatches();
      if (result.success && result.data) {
        setBatches(result.data);
      }
    } catch {
      error('No se pudo cargar los lotes de alimento');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useSyncRefresh(loadData);

  const handleCreateBatch = async (data: FeedBatchFormData) => {
    if (!user) {
      error('Debes estar autenticado');
      return;
    }

    try {
      setIsSubmitting(true);
      const service = await FeedingServiceProvider.getFeedingService();
      const result = await service.createFeedBatch({
        batchName: data.batchName,
        preparationDate: data.preparationDate,
        quantityKg: data.quantityKg,
        preparedBy: user.id,
      });

      if (result.success) {
        success(`Lote registrado: ${data.batchName} (${data.quantityKg.toFixed(2)} kg)`);
        setShowForm(false);
        await loadData();
      } else {
        error(result.error || 'Error al registrar el lote de alimento');
      }
    } catch {
      error('No se pudo registrar el lote de alimento');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
        <ScrollView className="flex-1">
          <View className="px-lg pt-xl pb-md border-b border-gray-200">
            <View className="flex-row items-center">
              <Package size={32} color={theme.colors.primary['500']} />
              <Text className="text-2xl font-bold text-textPrimary ml-md">
                Lotes de Alimento
              </Text>
            </View>
          </View>
          <View className="px-lg py-md gap-md">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="bg-white rounded-md border border-gray-100 p-md"
              >
                <View className="h-4 bg-gray-200 rounded w-3/4 mb-sm" />
                <View className="h-4 bg-gray-200 rounded w-1/2" />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* Header */}
        <View className="px-lg pt-xl pb-md border-b border-gray-200">
          <View className="flex-row items-center">
            <Package size={32} color={theme.colors.primary['500']} />
            <Text className="text-2xl font-bold text-textPrimary ml-md">
              Lotes de Alimento
            </Text>
          </View>
          <Text className="text-sm text-textSecondary mt-xs ml-12">
            {batches.length}{' '}
            {batches.length === 1 ? 'lote registrado' : 'lotes registrados'}
          </Text>
        </View>

        <View className="px-lg py-md gap-lg">
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
              <Text className="text-base font-semibold text-textPrimary mb-lg">
                Nuevo Lote de Alimento
              </Text>
              <FeedBatchForm
                onSubmit={handleCreateBatch}
                onCancel={() => setShowForm(false)}
                isSubmitting={isSubmitting}
              />
            </MotiView>
          )}

          {/* Batch list */}
          <View>
            <Text className="text-lg font-bold text-textPrimary mb-md">
              Lotes Registrados
            </Text>

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
                {batches.map((batch, index) => {
                  const usedKg = batch.quantityKg - batch.remainingQuantityKg;
                  const usedPct =
                    batch.quantityKg > 0
                      ? (usedKg / batch.quantityKg) * 100
                      : 0;
                  const isExhausted = batch.remainingQuantityKg <= 0;

                  return (
                    <MotiView
                      key={batch.id}
                      from={{ opacity: 0, translateY: 20 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{
                        type: 'timing',
                        duration: 250,
                        delay: index * 50,
                      }}
                    >
                      <View
                        className={`bg-white rounded-md border shadow-sm p-md ${
                          isExhausted
                            ? 'border-gray-200 opacity-60'
                            : 'border-gray-100'
                        }`}
                      >
                        {/* Batch header */}
                        <View className="flex-row items-center gap-md mb-md">
                          <View
                            className={`w-10 h-10 rounded-full items-center justify-center ${
                              isExhausted ? 'bg-gray-100' : 'bg-primary-100'
                            }`}
                          >
                            <Package
                              size={20}
                              color={
                                isExhausted
                                  ? theme.colors.gray['400']
                                  : theme.colors.primary['600']
                              }
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-base font-semibold text-textPrimary">
                              {batch.batchName}
                            </Text>
                            <Text className="text-xs text-textSecondary mt-xs">
                              Preparado:{' '}
                              {new Date(
                                batch.preparationDate + 'T12:00:00'
                              ).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </Text>
                          </View>
                          {isExhausted && (
                            <View className="bg-gray-100 px-sm py-xs rounded-full">
                              <Text className="text-xs text-textTertiary font-medium">
                                Agotado
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Quantity stats */}
                        <View className="flex-row gap-md mb-md">
                          <View className="flex-1 bg-gray-50 rounded-md p-sm items-center">
                            <Text className="text-xs text-textTertiary mb-xs">
                              Total
                            </Text>
                            <Text className="text-base font-bold text-textPrimary">
                              {batch.quantityKg.toFixed(2)}
                            </Text>
                            <Text className="text-xs text-textTertiary">kg</Text>
                          </View>
                          <View className="flex-1 bg-gray-50 rounded-md p-sm items-center">
                            <Text className="text-xs text-textTertiary mb-xs">
                              Usado
                            </Text>
                            <Text className="text-base font-bold text-textSecondary">
                              {usedKg.toFixed(2)}
                            </Text>
                            <Text className="text-xs text-textTertiary">kg</Text>
                          </View>
                          <View
                            className={`flex-1 rounded-md p-sm items-center ${
                              isExhausted ? 'bg-gray-50' : 'bg-primary-50'
                            }`}
                          >
                            <Text className="text-xs text-textTertiary mb-xs">
                              Disponible
                            </Text>
                            <Text
                              className={`text-base font-bold ${
                                isExhausted
                                  ? 'text-textTertiary'
                                  : 'text-primary-700'
                              }`}
                            >
                              {batch.remainingQuantityKg.toFixed(2)}
                            </Text>
                            <Text className="text-xs text-textTertiary">kg</Text>
                          </View>
                        </View>

                        {/* Usage progress bar */}
                        <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <View
                            className={`h-full rounded-full ${
                              isExhausted ? 'bg-gray-400' : 'bg-primary-500'
                            }`}
                            style={{ width: `${Math.min(100, usedPct)}%` }}
                          />
                        </View>
                        <Text className="text-xs text-textTertiary mt-xs text-right">
                          {usedPct.toFixed(1)}% utilizado
                        </Text>
                      </View>
                    </MotiView>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
