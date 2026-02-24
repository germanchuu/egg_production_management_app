import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { MotiView } from 'moti';

import {
  InvitationConfirmation,
  InvalidInvitation,
} from '@/features/auth/components';
import type { Invitation, User, AuthorizedDevice } from '@/shared/types/entities';
import { AuthStatus, UserRole } from '@/shared/types/entities';
import { AppLogo } from '@/shared/components/AppLogo';
import { useAuth } from '@/features/auth/contexts';
import { AuthService } from '@/features/auth/services/AuthService';
import { getDatabase } from '@/shared/database';
import { UserRepository } from '@/shared/database/repositories/UserRepository';
import { useToast } from '@/shared/hooks/useToast';
import { Toast } from '@/shared/components/Toast';

const FIREBASE_FUNCTION_BASE_URL =
  process.env.EXPO_PUBLIC_FIREBASE_FUNCTION_URL || '';

/* -------------------------------------------------------------------------- */
/*                               API helpers                                  */
/* -------------------------------------------------------------------------- */

async function validateInvitationToken(token: string) {
  try {
    const response = await fetch(
      `${FIREBASE_FUNCTION_BASE_URL}/validateInvitation`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }
    );

    return await response.json();
  } catch {
    return {
      valid: false,
      error: 'Error de conexión. Verifica tu internet.',
    };
  }
}

async function acceptInvitationOnServer(
  token: string,
  deviceId: string,
  deviceName: string
) {
  try {
    const response = await fetch(
      `${FIREBASE_FUNCTION_BASE_URL}/acceptInvitation`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, deviceId, deviceName }),
      }
    );

    return await response.json();
  } catch {
    return {
      success: false,
      error: 'Error de conexión. Verifica tu internet.',
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Screen                                     */
/* -------------------------------------------------------------------------- */

export default function InviteTokenScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { toast, success, error: showError, hide } = useToast();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [invitedUser, setInvitedUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');

  /* ----------------------------- Validation -------------------------------- */

  useEffect(() => {
    async function validate() {
      // Check if user is already authenticated
      if (isAuthenticated && user) {
        setError('Ya tienes una sesión activa');
        setLoading(false);
        return;
      }

      if (!token) {
        setError('Token de invitación no válido');
        setLoading(false);
        return;
      }

      const result = await validateInvitationToken(token);

      if (!result.valid) {
        setError(result.error || 'Invitación no válida');
        setLoading(false);
        return;
      }

      if (result.invitation && result.user) {
        setInvitation(result.invitation);
        setInvitedUser(result.user);
        setUserName(result.user.displayName);
      }

      setLoading(false);
    }

    validate();
  }, [token]);

  /* ------------------------------ Accept ----------------------------------- */

  const handleAccept = async () => {
    if (!token || !invitedUser) return;

    setAccepting(true);
    setError('');

    // Use the persistent SecureStore UUID as device ID so it matches what's
    // stored in the local session during validation.
    let deviceId = await SecureStore.getItemAsync('device_id');
    if (!deviceId) {
      deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      await SecureStore.setItemAsync('device_id', deviceId);
    }

    const deviceName =
      `${Device.brand} ${Device.modelName}` || 'Dispositivo desconocido';

    const result = await acceptInvitationOnServer(token, deviceId, deviceName);

    if (!result.success) {
      setError(result.error || 'Error al aceptar la invitación');
      setAccepting(false);
      return;
    }

    // Persist the authenticated user to the local DB and create a local session.
    // Without this step, AuthContext finds no session on the next app launch
    // and the user appears unauthenticated.
    try {
      const db = getDatabase();
      const userRepo = new UserRepository(db);
      const now = new Date().toISOString();

      const newDevice: AuthorizedDevice = { deviceId, deviceName, authorizedAt: now };
      const existingDevices: AuthorizedDevice[] = invitedUser.authorizedDevices ?? [];

      await userRepo.upsert({
        id: invitedUser.id,
        displayName: invitedUser.displayName,
        role: (invitedUser.role as UserRole) ?? UserRole.User,
        authStatus: AuthStatus.Authenticated,
        authorizedDevices: [...existingDevices, newDevice],
        isActive: (invitedUser as any).isActive ?? true,
        invitationId: (invitedUser as any).invitationId ?? undefined,
        createdAt: (invitedUser as any).createdAt ?? now,
        updatedAt: now,
      });

      await AuthService.storeSession({
        userId: invitedUser.id,
        deviceId,
        authenticatedAt: now,
        lastValidatedAt: now,
      });

      await refreshUser();
    } catch (sessionError) {
      console.error('[InviteScreen] Error saving local session:', sessionError);
      // Non-blocking — user still navigates but may need to re-accept on next open
    }

    setAccepting(false);
    success('¡Invitación aceptada! Ya puedes acceder a la aplicación');

    // Navigate after showing toast
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 1500);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Top Section - Colored header (60% height, no safe area top) */}
      <View className="h-[60%]">
        <LinearGradient colors={['#0097A7', '#00838F']} className="flex-1">
          {/* Decorative circles */}
          <View className="absolute -top-10 -right-16 w-32 h-32 rounded-full bg-white/10" />
          <View className="absolute top-40 -left-12 w-24 h-24 rounded-full bg-white/5" />
          <View className="absolute bottom-20 right-10 w-20 h-20 rounded-full bg-white/10" />

          <SafeAreaView
            edges={['top']}
            className="flex-1 justify-center items-center px-xl"
          >
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 400 }}
              className="items-center"
            >
              {/* App Icon/Logo */}
              <View className="bg-white rounded-2xl p-4 mb-lg shadow-lg">
                <AppLogo size={96} />
              </View>

              {/* Welcome Text */}
              <Text className="text-4xl font-bold text-white text-center mb-sm">
                Bienvenido a
              </Text>
              <Text className="text-3xl font-bold text-white text-center mb-md">
                {'Granja Avícola\nSan Vicente de Paúl'}
              </Text>
              <Text className="text-base text-white/90 text-center px-md">
                Sistema profesional de producción avícola
              </Text>
            </MotiView>
          </SafeAreaView>
        </LinearGradient>
      </View>

      {/* Bottom Section - White content area (40% height) */}
      <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
        <ScrollView
          className="flex-1 px-xl"
          contentContainerStyle={{ paddingVertical: 24 }}
        >
          {/* Loading state */}
          {loading && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 200 }}
              className="items-center py-xl"
            >
              <ActivityIndicator size="large" color="#0097A7" />
              <Text className="text-textPrimary text-lg mt-lg font-semibold text-center">
                Validando invitación…
              </Text>
              <Text className="text-textSecondary text-sm mt-sm text-center">
                Por favor espera un momento
              </Text>
            </MotiView>
          )}

          {/* Error state */}
          {!loading && error && !invitation && (
            <InvalidInvitation
              errorMessage={
                error === 'Ya tienes una sesión activa'
                  ? `Ya tienes una sesión activa como ${user?.displayName || 'usuario'}.`
                  : error
              }
            />
          )}

          {/* Success state */}
          {!loading && invitation && (
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
              <InvitationConfirmation
                invitation={invitation}
                userName={userName}
                onAccept={handleAccept}
                loading={accepting}
                errorMessage={error}
              />
            </ScrollView>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hide}
      />
    </View>
  );
}
