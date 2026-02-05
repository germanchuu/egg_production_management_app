/**
 * Debug Screen - Para Testing Manual
 *
 * Permite inspeccionar:
 * - Usuarios en BD local
 * - Sync Queue
 * - Ejecutar sincronización manual
 * - Ver logs
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
import { theme } from '@/core/theme';
import { getDatabase } from '@/shared/database';
import { UserRepository } from '@/shared/database/repositories';
import { SyncQueue } from '@/shared/sync/SyncQueue';
import { useSync } from '@/shared/hooks/useSync';

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

export default function DebugScreen() {
  const { sync, status, isOnline, error } = useSync();
  const isSyncing = status === 'syncing';

  const [users, setUsers] = useState<any[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'queue' | 'logs'>('users');

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  const loadData = async () => {
    try {
      addLog('Cargando datos...');
      const db = getDatabase();
      const userRepo = new UserRepository(db);

      // Cargar usuarios
      const usersList = await userRepo.findAll();
      setUsers(usersList);
      addLog(`✅ Usuarios cargados: ${usersList.length}`);

      // Cargar sync queue
      const queueResults = await db.getAllAsync<SyncQueueItem>(
        'SELECT * FROM sync_queue ORDER BY local_timestamp DESC LIMIT 50'
      );
      setSyncQueue(queueResults);
      addLog(`✅ Sync queue cargado: ${queueResults.length} items`);

    } catch (error) {
      addLog(`❌ Error cargando datos: ${error}`);
      console.error('Error loading debug data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSync = async () => {
    try {
      addLog('🔄 Iniciando sincronización...');
      addLog(`📡 Online: ${isOnline}`);
      addLog(`📊 Status antes: ${status}`);

      if (error) {
        addLog(`⚠️ Error previo: ${error.message}`);
      }

      await sync();

      addLog(`📊 Status después: ${status}`);
      addLog(`✅ Sync completado`);

      await loadData();
    } catch (error) {
      addLog(`❌ Error en sync: ${error}`);
      Alert.alert('Error', 'Error al sincronizar. Ver logs.');
    }
  };

  const handleClearSyncQueue = async () => {
    Alert.alert(
      'Limpiar Sync Queue',
      '¿Estás seguro? Esto eliminará todos los items pendientes de sincronización.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDatabase();
              await db.runAsync('DELETE FROM sync_queue');
              addLog('🗑️ Sync queue limpiado');
              await loadData();
            } catch (error) {
              addLog(`❌ Error limpiando queue: ${error}`);
            }
          },
        },
      ]
    );
  };

  const handleClearLogs = () => {
    setLogs([]);
    addLog('Logs limpiados');
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.DEFAULT }}>
      {/* Header */}
      <View style={{
        padding: 16,
        backgroundColor: theme.colors.primary['500'],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray['300'],
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: 8,
        }}>
          🛠️ Debug / Testing
        </Text>
        <Text style={{ fontSize: 14, color: '#fff', opacity: 0.9 }}>
          Inspección de BD Local y Sync Queue
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={{
        flexDirection: 'row',
        padding: 12,
        gap: 8,
        backgroundColor: theme.colors.background.secondary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray['300'],
      }}>
        <TouchableOpacity
          onPress={handleSync}
          disabled={isSyncing}
          style={{
            flex: 1,
            backgroundColor: isSyncing ? theme.colors.gray['400'] : '#10b981',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            {isSyncing ? '⏳ Syncing...' : '🔄 Sync Now'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRefresh}
          style={{
            flex: 1,
            backgroundColor: theme.colors.primary['500'],
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            🔃 Refresh
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.background.DEFAULT,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray['300'],
      }}>
        {(['users', 'queue', 'logs'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: 16,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab ? theme.colors.primary['500'] : 'transparent',
            }}
          >
            <Text style={{
              textAlign: 'center',
              fontWeight: activeTab === tab ? '600' : '400',
              color: activeTab === tab ? theme.colors.primary['500'] : theme.colors.textSecondary.DEFAULT,
            }}>
              {tab === 'users' && `👤 Users (${users.length})`}
              {tab === 'queue' && `📋 Queue (${syncQueue.filter(q => q.synced_at === null).length})`}
              {tab === 'logs' && `📝 Logs (${logs.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'users' && (
          <View style={{ padding: 16 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.textPrimary.DEFAULT,
              marginBottom: 12,
            }}>
              Usuarios en BD Local
            </Text>
            {users.length === 0 ? (
              <Text style={{ color: theme.colors.textSecondary.DEFAULT, fontStyle: 'italic' }}>
                No hay usuarios
              </Text>
            ) : (
              users.map((user, index) => (
                <View
                  key={user.id}
                  style={{
                    backgroundColor: theme.colors.background.DEFAULT,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.gray['300'],
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary.DEFAULT }}>
                    {index + 1}. {user.displayName}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary.DEFAULT, marginTop: 4 }}>
                    ID: {user.id}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary.DEFAULT }}>
                    Role: {user.role} | Status: {user.authStatus}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary.DEFAULT }}>
                    Active: {user.isActive ? '✅' : '❌'}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary.DEFAULT }}>
                    Authorized Devices: {user.authorizedDevices?.length || 0}
                  </Text>
                  {user.authorizedDevices && user.authorizedDevices.length > 0 && (
                    <View style={{ marginTop: 8, paddingLeft: 8 }}>
                      {user.authorizedDevices.map((device: any, idx: number) => (
                        <Text key={idx} style={{ fontSize: 11, color: theme.colors.textSecondary.DEFAULT }}>
                          • {device.deviceName} ({device.deviceId.slice(0, 8)}...)
                        </Text>
                      ))}
                    </View>
                  )}
                  <Text style={{ fontSize: 11, color: theme.colors.textSecondary.DEFAULT, marginTop: 4 }}>
                    Created: {new Date(user.createdAt).toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.colors.textSecondary.DEFAULT }}>
                    Updated: {new Date(user.updatedAt).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'queue' && (
          <View style={{ padding: 16 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.textPrimary.DEFAULT }}>
                Sync Queue
              </Text>
              <TouchableOpacity onPress={handleClearSyncQueue}>
                <Text style={{ color: '#ef4444', fontWeight: '600' }}>
                  🗑️ Limpiar
                </Text>
              </TouchableOpacity>
            </View>

            {syncQueue.length === 0 ? (
              <Text style={{ color: theme.colors.textSecondary.DEFAULT, fontStyle: 'italic' }}>
                Queue vacío
              </Text>
            ) : (
              syncQueue.map((item) => (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: theme.colors.background.DEFAULT,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: item.synced_at !== null ? '#10b981' : '#f59e0b',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary.DEFAULT }}>
                      {item.operation} - {item.entity_type}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: item.synced_at !== null ? '#10b981' : '#f59e0b',
                    }}>
                      {item.synced_at !== null ? '✅ Synced' : '⏳ Pending'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary.DEFAULT, marginTop: 4 }}>
                    Entity ID: {item.entity_id}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.colors.textSecondary.DEFAULT }}>
                    Created: {new Date(item.local_timestamp).toLocaleString()}
                  </Text>
                  {item.synced_at && (
                    <Text style={{ fontSize: 11, color: theme.colors.textSecondary.DEFAULT }}>
                      Synced: {new Date(item.synced_at).toLocaleString()}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'logs' && (
          <View style={{ padding: 16 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.textPrimary.DEFAULT }}>
                Logs de Actividad
              </Text>
              <TouchableOpacity onPress={handleClearLogs}>
                <Text style={{ color: '#ef4444', fontWeight: '600' }}>
                  🗑️ Limpiar
                </Text>
              </TouchableOpacity>
            </View>

            {logs.length === 0 ? (
              <Text style={{ color: theme.colors.textSecondary.DEFAULT, fontStyle: 'italic' }}>
                No hay logs
              </Text>
            ) : (
              logs.map((log, index) => (
                <Text
                  key={index}
                  style={{
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: theme.colors.textPrimary.DEFAULT,
                    paddingVertical: 4,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.gray['200'],
                  }}
                >
                  {log}
                </Text>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
