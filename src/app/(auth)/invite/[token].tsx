import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import * as Device from 'expo-device';
import { MotiView } from 'moti';

import {
  InvitationConfirmation,
  InvalidInvitation,
} from '@/features/auth/components';
import type { Invitation } from '@/shared/types/entities';
import { Shield } from 'lucide-react-native';

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

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');

  /* ----------------------------- Validation -------------------------------- */

  useEffect(() => {
    async function validate() {
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
        setUserName(result.user.displayName);
      }

      setLoading(false);
    }

    validate();
  }, [token]);

  /* ------------------------------ Accept ----------------------------------- */

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    setError('');

    const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown';

    const deviceName =
      `${Device.brand} ${Device.modelName}` || 'Dispositivo desconocido';

    const result = await acceptInvitationOnServer(token, deviceId, deviceName);

    if (!result.success) {
      setError(result.error || 'Error al aceptar la invitación');
      setAccepting(false);
      return;
    }

    Alert.alert('Invitación aceptada', 'Ya puedes acceder a la aplicación.', [
      {
        text: 'Continuar',
        onPress: () => router.replace('/(tabs)'),
      },
    ]);
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
              <View className="w-32 h-32 rounded-3xl bg-white items-center justify-center mb-lg shadow-lg">
                <Text className="text-7xl">🥚</Text>
              </View>

              {/* Welcome Text */}
              <Text className="text-4xl font-bold text-white text-center mb-sm">
                Bienvenido a
              </Text>
              <Text className="text-3xl font-bold text-white text-center mb-md">
                Gestión de Huevos
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
            <InvalidInvitation errorMessage={error} />
          )}

          {/* Success state */}
          {!loading && invitation && (
            <InvitationConfirmation
              invitation={invitation}
              userName={userName}
              onAccept={handleAccept}
              loading={accepting}
              errorMessage={error}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      {/* DEV BUTTON – GUARANTEED */}
      <Modal visible transparent animationType="none">
        <View
          pointerEvents="box-none"
          style={{
            flex: 1,
            backgroundColor: 'transparent',
          }}
        >
          <Pressable
            onPress={() => router.push('/(auth)/dev-login')}
            style={({ pressed }) => ({
              position: 'absolute',
              bottom: 32,
              right: 24,
              backgroundColor: '#FF6B00',
              borderRadius: 999,
              padding: 20,
              elevation: 9999,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Shield size={36} stroke="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
