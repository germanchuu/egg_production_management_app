/**
 * Health & Biosecurity Screen (T141, T142)
 *
 * Two Material Top Tabs:
 *   - Salud: vaccination form + history (lot-level)
 *   - Bioseguridad: disinfection form + history (farm-level)
 */

import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { ChickenLot } from '@/shared/types/entities';
import { FacilityServiceProvider } from '@/features/facilities/services/FacilityServiceProvider';
import { EventServiceProvider } from '@/features/health-biosecurity/services/EventServiceProvider';
import { HealthEvent } from '@/features/health-biosecurity/models/HealthEvent';
import { BiosecurityEvent } from '@/features/health-biosecurity/models/BiosecurityEvent';
import { HealthEventFormData, BiosecurityEventFormData } from '@/features/health-biosecurity/utils/validation';
import { HealthBiosecurityProvider } from '@/features/health-biosecurity/contexts/HealthBiosecurityContext';
import { HealthBiosecurityTabNavigator } from '@/features/health-biosecurity/components/HealthBiosecurityTabBar';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useToastContext } from '@/shared/contexts/ToastContext';
import { useSyncRefresh } from '@/shared/contexts/SyncContext';
import { theme } from '@/core/theme';

// ─── Screen header ────────────────────────────────────────────────────────────

const HealthBiosecurityHeader: React.FC = () => (
  <View className="px-lg pt-xl pb-md bg-white border-b border-gray-200">
    <View className="flex-row items-center">
      <ShieldCheck size={28} color={theme.colors.primary['500']} />
      <Text className="text-2xl font-bold text-textPrimary ml-md">Salud & Bioseguridad</Text>
    </View>
    <Text className="text-sm text-textSecondary mt-xs ml-12">
      Vacunaciones y desinfecciones del plantel
    </Text>
  </View>
);

// ─── HealthBiosecurityScreen ──────────────────────────────────────────────────

export default function HealthBiosecurityScreen() {
  const { user } = useAuth();
  const { success, error } = useToastContext();

  const [lots, setLots] = useState<ChickenLot[]>([]);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [biosecurityEvents, setBiosecurityEvents] = useState<BiosecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const facilityService = await FacilityServiceProvider.getFacilityService();
      const eventService = await EventServiceProvider.getEventService();

      const [lotsResult, healthResult, biosecurityResult] = await Promise.all([
        facilityService.listActiveLots(),
        eventService.listHealthEvents(),
        eventService.listBiosecurityEvents(),
      ]);

      if (lotsResult.success && lotsResult.data) setLots(lotsResult.data);
      if (healthResult.success && healthResult.data) setHealthEvents(healthResult.data);
      if (biosecurityResult.success && biosecurityResult.data)
        setBiosecurityEvents(biosecurityResult.data);
    } catch {
      error('No se pudo cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  useSyncRefresh(loadData);

  const handleRecordHealthEvent = async (data: HealthEventFormData) => {
    if (!user) { error('Debes estar autenticado'); return; }
    try {
      setIsSubmitting(true);
      const service = await EventServiceProvider.getEventService();
      const result = await service.recordHealthEvent({
        lotId: data.lotId,
        eventDate: data.eventDate,
        productName: data.productName,
        notes: data.notes,
        recordedBy: user.id,
      });
      if (result.success) {
        success(`Vacunación registrada: ${data.productName}`);
        await loadData();
      } else {
        error(result.error || 'Error al registrar la vacunación');
      }
    } catch {
      error('No se pudo registrar la vacunación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordBiosecurityEvent = async (data: BiosecurityEventFormData) => {
    if (!user) { error('Debes estar autenticado'); return; }
    try {
      setIsSubmitting(true);
      const service = await EventServiceProvider.getEventService();
      const result = await service.recordBiosecurityEvent({
        eventDate: data.eventDate,
        productName: data.productName,
        notes: data.notes,
        recordedBy: user.id,
      });
      if (result.success) {
        success(`Desinfección registrada: ${data.productName}`);
        await loadData();
      } else {
        error(result.error || 'Error al registrar la desinfección');
      }
    } catch {
      error('No se pudo registrar la desinfección');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <HealthBiosecurityProvider
        value={{
          lots,
          healthEvents,
          biosecurityEvents,
          loading,
          isSubmitting,
          onRecordHealthEvent: handleRecordHealthEvent,
          onRecordBiosecurityEvent: handleRecordBiosecurityEvent,
        }}
      >
        <HealthBiosecurityHeader />
        <HealthBiosecurityTabNavigator />
      </HealthBiosecurityProvider>
    </SafeAreaView>
  );
}
