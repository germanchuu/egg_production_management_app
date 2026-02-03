/**
 * Developer Login Screen
 *
 * TEMPORARY screen for development/testing purposes only.
 * Allows bypassing invitation flow to test admin features.
 *
 * TO USE:
 * 1. Navigate to /dev-login in the app
 * 2. Click "Login as Test Admin"
 * 3. You'll be logged in and redirected to the app
 *
 * ⚠️ REMOVE THIS FILE IN PRODUCTION
 */

import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Shield, AlertTriangle } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { Button } from '@/shared/components';
import { useAuth } from '@/features/auth/contexts';
import { UserRole, AuthStatus } from '@/shared/types/entities';
import type { User } from '@/shared/types/entities';
import { getDatabase } from '@/shared/database';

export default function DevLoginScreen() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDevLogin = async () => {
    setLoading(true);

    try {
      const db = await getDatabase();
      const userId = 'dev-admin-001';
      const now = new Date().toISOString();

      // Create a mock admin user for testing
      // NOTE: Must use Pending status so acceptInvitation validation passes
      const mockAdminUser: User = {
        id: userId,
        displayName: 'Admin de Prueba',
        role: UserRole.Admin,
        authStatus: AuthStatus.Pending,
        authorizedDevices: [],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      // Check if user already exists in local DB
      const existingUser = await db.getFirstAsync<any>(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );

      if (!existingUser) {
        // Insert user into local database
        await db.runAsync(
          `INSERT INTO users (
            id, display_name, role, auth_status, authorized_devices,
            is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            mockAdminUser.id,
            mockAdminUser.displayName,
            mockAdminUser.role,
            mockAdminUser.authStatus,
            JSON.stringify(mockAdminUser.authorizedDevices),
            mockAdminUser.isActive ? 1 : 0,
            mockAdminUser.createdAt,
            mockAdminUser.updatedAt,
          ]
        );
      }

      // Login with mock user
      await login(mockAdminUser, 'Development Device');

      Alert.alert(
        'Login Exitoso',
        'Has iniciado sesión como administrador de prueba.',
        [
          {
            text: 'Continuar',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Error in dev login:', error);
      Alert.alert('Error', 'No se pudo iniciar sesión de desarrollo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center px-xl">
        {/* Warning Banner */}
        <View className="bg-warning/10 border border-warning rounded-md p-md mb-xl">
          <View className="flex-row items-center gap-sm mb-sm">
            <AlertTriangle size={20} color={theme.colors.warning.DEFAULT} />
            <Text className="text-sm font-semibold text-warning">
              Modo de Desarrollo
            </Text>
          </View>
          <Text className="text-xs text-textSecondary">
            Esta pantalla es SOLO para desarrollo y testing.{'\n'}
            Eliminar antes de producción.
          </Text>
        </View>

        {/* Icon */}
        <View className="w-24 h-24 rounded-full bg-secondary-100 items-center justify-center mb-lg">
          <Shield size={48} color={theme.colors.secondary['500']} />
        </View>

        {/* Title */}
        <Text className="text-2xl font-bold text-textPrimary text-center mb-sm">
          Login de Desarrollo
        </Text>
        <Text className="text-base text-textSecondary text-center mb-xl px-lg">
          Inicia sesión como administrador de prueba para testear la aplicación
          sin necesidad de invitación.
        </Text>

        {/* Login Button */}
        <View className="w-full mb-md">
          <Button
            variant="primary"
            icon={Shield}
            onPress={handleDevLogin}
            loading={loading}
            disabled={loading}
          >
            Login como Admin de Prueba
          </Button>
        </View>

        {/* Info */}
        <View className="bg-primary-50 border border-primary-200 rounded-md p-md mt-lg">
          <Text className="text-xs text-textPrimary-700 text-center">
            Este login crea una sesión local temporal.{'\n'}
            No se conecta a Firebase ni valida invitaciones.
          </Text>
        </View>

        {/* Instructions */}
        <View className="mt-xl px-md">
          <Text className="text-xs font-semibold text-textSecondary mb-xs">
            Cómo usar:
          </Text>
          <Text className="text-xs text-textTertiary mb-xs">
            1. Presiona "Login como Admin de Prueba"
          </Text>
          <Text className="text-xs text-textTertiary mb-xs">
            2. Accede a la pantalla de gestión de usuarios
          </Text>
          <Text className="text-xs text-textTertiary mb-xs">
            3. Testea crear usuarios, generar invitaciones, etc.
          </Text>
          <Text className="text-xs text-textTertiary">
            4. Para login real, usa una invitación válida
          </Text>
        </View>

        {/* Warning Footer */}
        <Text className="text-xs text-error text-center mt-xl">
          ⚠️ ELIMINAR ESTE ARCHIVO ANTES DE PRODUCCIÓN
        </Text>
      </View>
    </SafeAreaView>
  );
}
