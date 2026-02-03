import React from 'react';
import { View, Text } from 'react-native';
import { Sun, Moon, User, Shield } from 'lucide-react-native';
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
        <View
          className="absolute -right-8 -top-8 h-32 w-32 rounded-full"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        />
        <View
          className="absolute -left-4 bottom-0 h-24 w-24 rounded-full"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        />
        <View
          className="absolute right-1/4 top-1/2 h-16 w-16 rounded-full"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
        />
      </View>

      <View className="p-6">
        {/* Main content */}
        <View className="relative flex-row items-start gap-4">
          {/* Avatar */}
          <View
            className="h-16 w-16 rounded-2xl items-center justify-center shadow-lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            <User size={32} color={theme.colors.background.DEFAULT} />
          </View>

          {/* Info */}
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-2 mb-1">
              <TimeIcon size={16} color={theme.colors.background.DEFAULT} />
              <Text
                className="text-sm"
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                {getGreeting()}
              </Text>
            </View>

            <Text
              className="text-2xl font-bold truncate"
              style={{ color: theme.colors.background.DEFAULT }}
            >
              {user.displayName.split(' ')[0]}
            </Text>

            <View className="flex-row items-center gap-2 mt-2">
              <View
                className="flex-row items-center gap-1.5 px-3 py-1 rounded-full"
                style={{
                  backgroundColor: isAdmin
                    ? 'rgba(255, 255, 255, 0.25)'
                    : 'rgba(255, 255, 255, 0.15)',
                }}
              >
                {isAdmin && (
                  <Shield size={12} color={theme.colors.background.DEFAULT} />
                )}
                <Text
                  className="text-xs font-medium"
                  style={{ color: theme.colors.background.DEFAULT }}
                >
                  {isAdmin ? 'Administrador' : 'Usuario'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View
          className="relative mt-6 pt-4 flex-row justify-between"
          style={{
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <View className="flex-1 items-center">
            <Text
              className="text-2xl font-bold"
              style={{ color: theme.colors.background.DEFAULT }}
            >
              8
            </Text>
            <Text
              className="text-xs"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Lotes activos
            </Text>
          </View>

          <View
            className="flex-1 items-center"
            style={{
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <Text
              className="text-2xl font-bold"
              style={{ color: theme.colors.background.DEFAULT }}
            >
              1,234
            </Text>
            <Text
              className="text-xs"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Huevos hoy
            </Text>
          </View>

          <View className="flex-1 items-center">
            <Text
              className="text-2xl font-bold"
              style={{ color: theme.colors.background.DEFAULT }}
            >
              98%
            </Text>
            <Text
              className="text-xs"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Productividad
            </Text>
          </View>
        </View>
      </View>
    </AnimatedView>
  );
}
