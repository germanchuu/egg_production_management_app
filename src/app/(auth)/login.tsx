/**
 * Admin Login Screen
 *
 * Allows first-time admin login using an access code (Firestore document ID).
 * The access code is secure, unique, and acts as the authentication credential.
 *
 * Architecture:
 * - Uses custom hook (useAdminLogin) for business logic
 * - Uses Toast for user feedback (MANDATORY per constitution)
 * - UI component only handles presentation and user interaction
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, ArrowLeft, LogIn, Eye, EyeOff } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { router } from 'expo-router';
import { useAdminLogin } from '@/features/auth/hooks/useAdminLogin';
import { useAuth } from '@/features/auth/contexts';
import { useToast } from '@/shared/hooks/useToast';
import { Toast } from '@/shared/components/Toast';

export default function LoginScreen() {
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  const { loginAdmin, isLoading } = useAdminLogin();
  const { refreshUser } = useAuth();
  const { toast, success, error, hide } = useToast();

  /**
   * Handle admin login
   */
  const handleLogin = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    const result = await loginAdmin(accessCode);

    if (result.success) {
      await refreshUser();

      success('Sesión iniciada correctamente');
      // Small delay to show toast before navigation
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } else {
      error('Código de acceso inválido');
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Top Section - Gradient 60% */}
          <View className="h-[60%]">
            <LinearGradient colors={['#0097A7', '#00838F']} className="flex-1">
              <View className="absolute -top-10 -right-16 w-32 h-32 rounded-full bg-white/10" />
              <View className="absolute bottom-10 -left-12 w-24 h-24 rounded-full bg-white/5" />

              <SafeAreaView edges={['top']} className="flex-1">
                {/* Back Button */}
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="ml-md mt-sm p-sm active:opacity-70"
                >
                  <ArrowLeft size={24} color="white" />
                </TouchableOpacity>

                {/* Header */}
                <View className="flex-1 justify-center items-center px-xl">
                  <View className="bg-white rounded-full p-5 mb-md shadow-lg">
                    <Shield size={48} color={theme.colors.primary['500']} />
                  </View>

                  <Text className="text-2xl font-bold text-white text-center mb-xs">
                    Acceso Administrativo
                  </Text>
                  <Text className="text-sm text-white/80 text-center">
                    Ingresa tu código de acceso
                  </Text>
                </View>
              </SafeAreaView>
            </LinearGradient>
          </View>

          {/* Bottom Section - Form 40% */}
          <SafeAreaView edges={['bottom']} className="h-[40%] bg-background">
            <View className="flex-1 px-xl pt-lg pb-md justify-between">
              <View>
                {/* Info Box */}
                <View className="bg-info/10 border border-info/20 rounded-xl p-sm mb-md">
                  <Text className="text-[11px] text-textSecondary text-center leading-snug">
                    Ingresa el código de acceso único proporcionado por el
                    administrador del sistema. Este código es confidencial y te
                    permitirá acceder a todas las funciones administrativas.
                  </Text>
                </View>

                {/* Login Form */}
                <View className="mb-md">
                  <Text className="text-sm font-semibold text-textPrimary mb-xs">
                    Código de Acceso
                  </Text>
                  <View className="relative">
                    <TextInput
                      value={accessCode}
                      onChangeText={setAccessCode}
                      placeholder="••••••••••••••••••••"
                      placeholderTextColor={theme.colors.textTertiary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry={!showCode}
                      editable={!isLoading}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      className="bg-white border border-gray-200 rounded-xl px-lg py-md pr-16 text-base text-textPrimary font-mono"
                    />
                    <TouchableOpacity
                      onPress={() => setShowCode(!showCode)}
                      className="absolute right-3 top-0 bottom-0 justify-center px-sm active:opacity-50"
                    >
                      {showCode ? (
                        <EyeOff
                          size={20}
                          color={theme.colors.primary.DEFAULT}
                        />
                      ) : (
                        <Eye size={20} color={theme.colors.primary.DEFAULT} />
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text className="text-[11px] text-textTertiary mt-xs">
                    Copiar y pega el código
                  </Text>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading || !accessCode.trim()}
                  className={`rounded-xl py-md flex-row items-center justify-center gap-sm ${
                    isLoading || !accessCode.trim()
                      ? 'bg-primary-200'
                      : 'bg-primary-500 active:bg-primary-600'
                  }`}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <LogIn size={20} color="white" />
                      <Text className="text-base font-semibold text-white">
                        Iniciar Sesión
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Help Text */}
              <View>
                <Text className="text-[11px] text-textTertiary text-center leading-snug mt-md">
                  ¿No tienes un código? Solicita a un administrador que te envíe
                  una invitación.
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hide}
      />
    </>
  );
}
