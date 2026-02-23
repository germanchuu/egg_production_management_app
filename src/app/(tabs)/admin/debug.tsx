/**
 * Sync Screen
 *
 * Manual synchronization controls and queue inspection.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, CloudOff, Wifi, Trash2, CheckCircle, Clock } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { getDatabase } from '@/shared/database';
import { useSyncContext } from '@/shared/contexts';

interface SyncQueueItem {
  id: string;
  entity_type: string;
  entity_id: string;
  operation: string;
  local_timestamp: string;
  synced_at: string | null;
  retry_count: number;
  error: string | null;
}

const ENTITY_LABELS: Record<string, string> = {
  chicken_houses: 'Galpón',
  chicken_lots: 'Lote',
  production_records: 'Registro de producción',
  mortality_records: 'Registro de mortalidad',
  feeding_records: 'Registro de alimentación',
  feed_batches: 'Lote de alimento',
  lot_events: 'Evento sanitario',
  invitations: 'Invitación',
  users: 'Usuario',
};

const OPERATION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
};

function getEntityLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? entityType;
}

function getOperationLabel(operation: string): string {
  return OPERATION_LABELS[operation] ?? operation;
}

export default function SyncScreen() {
  const { sync, status, isOnline, lastSyncAt, pendingCount } = useSyncContext();
  const isSyncing = status === 'syncing';

  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadQueue = async () => {
    try {
      const db = getDatabase();
      const items = await db.getAllAsync<SyncQueueItem>(
        'SELECT * FROM sync_queue ORDER BY local_timestamp DESC LIMIT 100'
      );
      setSyncQueue(items);
    } catch (err) {
      console.error('Error loading sync queue:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  };

  const handleFastSync = async () => {
    await sync(false);
    await loadQueue();
  };

  const handleFullSync = async () => {
    await sync(true);
    await loadQueue();
  };

  const handleClearQueue = () => {
    Alert.alert(
      'Limpiar cola de sincronización',
      '¿Estás seguro? Esto eliminará todos los elementos pendientes de sincronización.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            const db = getDatabase();
            await db.runAsync('DELETE FROM sync_queue');
            await loadQueue();
          },
        },
      ]
    );
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadQueue(); }, []);

  const pendingItems = syncQueue.filter((q) => q.synced_at === null);
  const syncedItems = syncQueue.filter((q) => q.synced_at !== null);

  const lastSyncStr = lastSyncAt
    ? lastSyncAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="px-lg pt-xl pb-md border-b border-gray-200">
          <View className="flex-row items-center gap-md">
            <RefreshCw size={28} color={theme.colors.primary['500']} />
            <Text className="text-2xl font-bold text-textPrimary">
              Sincronización
            </Text>
          </View>

          {/* Status row */}
          <View className="flex-row items-center gap-sm mt-sm">
            {isOnline ? (
              <Wifi size={14} color={theme.colors.success.DEFAULT} />
            ) : (
              <CloudOff size={14} color={theme.colors.error.DEFAULT} />
            )}
            <Text className="text-sm text-textSecondary">
              {isOnline ? 'En línea' : 'Sin conexión'}
              {lastSyncStr ? ` · Última sync: ${lastSyncStr}` : ''}
            </Text>
            {pendingCount > 0 && (
              <View className="ml-auto bg-warning/10 px-sm py-0.5 rounded-full">
                <Text className="text-xs font-semibold text-warning">
                  {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Sync Buttons */}
        <View className="px-lg py-md gap-sm">
          <TouchableOpacity
            onPress={handleFastSync}
            disabled={isSyncing || !isOnline}
            className="bg-primary-500 rounded-xl p-md items-center"
            style={{ opacity: isSyncing || !isOnline ? 0.5 : 1 }}
          >
            <Text className="text-white font-semibold text-base">
              {isSyncing ? 'Sincronizando...' : 'Sincronización rápida'}
            </Text>
            <Text className="text-white/70 text-xs mt-0.5">
              Inserciones y actualizaciones recientes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleFullSync}
            disabled={isSyncing || !isOnline}
            className="bg-white border border-primary-300 rounded-xl p-md items-center"
            style={{ opacity: isSyncing || !isOnline ? 0.5 : 1 }}
          >
            <Text className="text-primary-600 font-semibold text-base">
              Sincronización completa
            </Text>
            <Text className="text-textTertiary text-xs mt-0.5">
              Incluye detección de eliminaciones
            </Text>
          </TouchableOpacity>
        </View>

        {/* Queue section */}
        <View className="px-lg pb-xl">
          {/* Section header */}
          <View className="flex-row items-center justify-between mb-sm">
            <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wide">
              Cola de sincronización
            </Text>
            {syncQueue.length > 0 && (
              <TouchableOpacity onPress={handleClearQueue} className="flex-row items-center gap-xs">
                <Trash2 size={14} color={theme.colors.error.DEFAULT} />
                <Text className="text-xs font-medium text-error">Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>

          {syncQueue.length === 0 && (
            <View className="items-center py-xl">
              <CheckCircle size={40} color={theme.colors.success.DEFAULT} />
              <Text className="text-base font-medium text-textPrimary mt-md">
                Todo sincronizado
              </Text>
              <Text className="text-sm text-textSecondary mt-xs text-center">
                No hay elementos pendientes de sincronizar.
              </Text>
            </View>
          )}

          {/* Pending items */}
          {pendingItems.length > 0 && (
            <View className="mb-md">
              <Text className="text-xs font-semibold text-warning uppercase mb-xs">
                Pendientes ({pendingItems.length})
              </Text>
              {pendingItems.map((item) => (
                <View
                  key={item.id}
                  className="bg-white border border-warning/40 rounded-xl p-md mb-xs"
                >
                  <View className="flex-row items-center gap-xs">
                    <Clock size={14} color={theme.colors.warning.DEFAULT} />
                    <Text className="text-sm font-medium text-textPrimary flex-1">
                      {getOperationLabel(item.operation)} · {getEntityLabel(item.entity_type)}
                    </Text>
                  </View>
                  <Text className="text-xs text-textTertiary mt-xs">
                    {new Date(item.local_timestamp).toLocaleString('es-ES')}
                  </Text>
                  {item.error && (
                    <Text className="text-xs text-error mt-xs">{item.error}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Synced items */}
          {syncedItems.length > 0 && (
            <View>
              <Text className="text-xs font-semibold text-success uppercase mb-xs">
                Sincronizados ({syncedItems.length})
              </Text>
              {syncedItems.map((item) => (
                <View
                  key={item.id}
                  className="bg-white border border-success/30 rounded-xl p-md mb-xs"
                >
                  <View className="flex-row items-center gap-xs">
                    <CheckCircle size={14} color={theme.colors.success.DEFAULT} />
                    <Text className="text-sm font-medium text-textSecondary flex-1">
                      {getOperationLabel(item.operation)} · {getEntityLabel(item.entity_type)}
                    </Text>
                  </View>
                  <Text className="text-xs text-textTertiary mt-xs">
                    Sincronizado:{' '}
                    {item.synced_at
                      ? new Date(item.synced_at).toLocaleString('es-ES')
                      : '—'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
