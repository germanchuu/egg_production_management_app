import React from 'react';
import { View, Text } from 'react-native';
import { Sun, Moon, Shield } from 'lucide-react-native';
import { AppLogo } from '@/shared/components/AppLogo';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuth } from '@/features/auth/contexts';
import { UserRole } from '@/shared/types/entities';
import { theme } from '@/core/theme';

const AnimatedView = Animated.createAnimatedComponent(View);

export function UserHeader() {
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === UserRole.Admin;

  const hour = new Date().getHours();
  const getGreeting = () => {
    if (hour >= 5 && hour < 12) return 'Buenos días';
    if (hour >= 12 && hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const TimeIcon = hour < 18 ? Sun : Moon;

  return (
    <AnimatedView
      entering={FadeIn}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Gradient Background */}
      <LinearGradient
        colors={[
          theme.colors.primary['500'],
          theme.colors.primary['600'],
          theme.colors.primary['700'],
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      {/* Background pattern */}
      <View className="absolute inset-0 opacity-10">
        <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20" />
        <View className="absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-white/10" />
        <View className="absolute right-1/4 top-1/2 h-16 w-16 rounded-full bg-white/15" />
      </View>

      <View className="p-6">
        {/* Main content */}
        <View className="relative flex-row items-start gap-4">
          {/* Avatar */}
          <View className="self-stretch rounded-2xl overflow-hidden shadow-lg bg-white items-center justify-center">
            <AppLogo size={64} />
          </View>

          {/* Info */}
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-2 mb-1">
              <TimeIcon size={16} color={theme.colors.background.DEFAULT} />
              <Text className="text-sm text-white/80">
                {getGreeting()}
              </Text>
            </View>

            <Text className="text-2xl font-bold truncate text-white">
              {user.displayName.split(' ')[0]}
            </Text>

            <View className="flex-row items-center gap-2 mt-2">
              <View
                className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full ${
                  isAdmin ? 'bg-white/25' : 'bg-white/15'
                }`}
              >
                {isAdmin && (
                  <Shield size={12} color={theme.colors.background.DEFAULT} />
                )}
                <Text className="text-xs font-medium text-white">
                  {isAdmin ? 'Administrador' : 'Usuario'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View className="relative mt-6 pt-4 flex-row justify-between border-t border-white/20">
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-white">
              8
            </Text>
            <Text className="text-xs text-white/70">
              Lotes activos
            </Text>
          </View>

          <View className="flex-1 items-center border-l border-r border-white/20">
            <Text className="text-2xl font-bold text-white">
              1,234
            </Text>
            <Text className="text-xs text-white/70">
              Huevos hoy
            </Text>
          </View>

          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-white">
              98%
            </Text>
            <Text className="text-xs text-white/70">
              Productividad
            </Text>
          </View>
        </View>
      </View>
    </AnimatedView>
  );
}
