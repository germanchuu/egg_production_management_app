import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Shield } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { router } from 'expo-router';

export function WaitingForInvitation() {
  return (
    <View className="flex-1 bg-background">
      {/* Top Section - Gradient 60% */}
      <View className="h-[60%]">
        <LinearGradient colors={['#0097A7', '#00838F']} className="flex-1">
          <View className="absolute -top-10 -right-16 w-32 h-32 rounded-full bg-white/10" />
          <View className="absolute top-40 -left-12 w-24 h-24 rounded-full bg-white/5" />
          <View className="absolute bottom-20 right-10 w-20 h-20 rounded-full bg-white/10" />

          <SafeAreaView
            edges={['top']}
            className="flex-1 justify-center items-center px-xl"
          >
            <View className="items-center">
              <View className="bg-white rounded-full p-6 mb-lg shadow-lg">
                <Mail size={64} color={theme.colors.primary['500']} />
              </View>

              <Text className="text-3xl font-bold text-white text-center mb-sm">
                Bienvenido a
              </Text>
              <Text className="text-2xl font-bold text-white text-center mb-md">
                Gestión de Huevos
              </Text>

              <Text className="text-base text-white/90 text-center px-md">
                Necesitas una invitación para comenzar
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      {/* Bottom Section - White 40% */}
      <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
        <View className="flex-1 px-xl py-xl justify-center">
          <View className="bg-info/10 border border-info/20 rounded-xl p-lg w-full">
            <View className="flex-row items-start gap-md mb-md">
              <Shield size={24} color={theme.colors.info.DEFAULT} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-textPrimary mb-xs">
                  ¿Cómo obtener acceso?
                </Text>
                <Text className="text-sm text-textSecondary leading-relaxed">
                  Solicita a un administrador que genere una invitación para ti.
                  Recibirás un enlace para configurar tu cuenta.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-md">
              <Mail size={24} color={theme.colors.info.DEFAULT} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-textPrimary mb-xs">
                  ¿Qué hacer con la invitación?
                </Text>
                <Text className="text-sm text-textSecondary leading-relaxed">
                  Ábrela en este dispositivo para completar tu registro.
                </Text>
              </View>
            </View>

            <Text className="text-[11px] text-textTertiary mt-md text-center">
              Si ya recibiste una invitación, ábrela desde este dispositivo
            </Text>
          </View>

          {/* Hidden Admin Access */}
          <View className="flex flex-row mx-auto mt-sm">
            <Text className="text-[11px] text-textTertiary/60">
              Si eres administrador y tienes un código,{' '}
            </Text>
            <Pressable
              onPress={() => router.push('/(auth)/login')}
              className="items-center"
            >
              <Text className="text-[11px] text-primary-500/80">
                inicia sesión aquí
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
