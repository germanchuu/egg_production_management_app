/**
 * WaitingForInvitation Component
 *
 * Welcome screen shown to users who are not authenticated and haven't clicked
 * an invitation deep link. Explains they need an invitation from an admin.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Shield } from 'lucide-react-native';
import { theme } from '@/core/theme';

export function WaitingForInvitation() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-xl">
        {/* Icon */}
        <View className="bg-primary-100 rounded-full p-6 mb-lg">
          <Mail size={64} color={theme.colors.primary['500']} />
        </View>

        {/* Title */}
        <Text className="text-2xl font-bold text-textPrimary mb-md text-center">
          Bienvenido a Gestión de Huevos
        </Text>

        {/* Description */}
        <Text className="text-base text-textSecondary mb-xl text-center leading-relaxed">
          Para poder utilizar la aplicación, necesitas recibir una invitación de
          un administrador.
        </Text>

        {/* Info Box */}
        <View className="bg-info/10 border border-info/20 rounded-xl p-lg w-full">
          <View className="flex-row items-start gap-md mb-md">
            <Shield size={24} color={theme.colors.info.DEFAULT} />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-textPrimary mb-xs">
                ¿Cómo obtener acceso?
              </Text>
              <Text className="text-sm text-textSecondary leading-relaxed">
                Solicita a un administrador que genere una invitación para ti.
                Recibirás un enlace que te permitirá configurar tu cuenta.
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
                Cuando recibas el enlace de invitación, ábrelo en este
                dispositivo para completar tu registro.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text className="text-xs text-textTertiary mt-xl text-center">
          Si ya recibiste una invitación, asegúrate de abrirla en este
          dispositivo
        </Text>
      </View>
    </SafeAreaView>
  );
}
