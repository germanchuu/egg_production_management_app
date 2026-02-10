import { MotiText, MotiView } from 'moti';
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export interface SplashScreenProps {
  isLoading?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isLoading = true,
}) => {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      {/* Glow background */}
      <MotiView
        className="absolute w-72 h-72 rounded-full bg-primary"
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 0.15 }}
        transition={{ type: 'timing', duration: 1500 }}
      />

      <MotiView
        className="absolute w-56 h-56 rounded-full bg-primary"
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.1 }}
        transition={{ type: 'timing', duration: 1500 }}
      />

      {/* Logo */}
      <MotiView
        className="w-24 h-24 rounded-3xl items-center justify-center bg-primary shadow-lg"
        from={{ scale: 0, rotate: '-30deg' }}
        animate={{ scale: 1, rotate: '0deg' }}
        transition={{
          type: 'timing',
          duration: 800,
        }}
      >
        <Text className="text-5xl">🐔</Text>
      </MotiView>

      {/* App name */}
      <MotiText
        className="mt-xl text-3xl font-bold text-textPrimary"
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 500, duration: 500 }}
      >
        AviGestión
      </MotiText>

      {/* Tagline */}
      <MotiText
        className="mt-sm text-sm text-textTertiary"
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 800, duration: 500 }}
      >
        Gestión avícola inteligente
      </MotiText>

      {/* Loading dots */}
      <View className="flex-row gap-2 mt-10">
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            from={{ scale: 1, opacity: 0.4 }}
            animate={{ scale: 1.4, opacity: 1 }}
            transition={{
              loop: true,
              type: 'timing',
              duration: 800,
              delay: i * 200,
            }}
          />
        ))}
      </View>
    </View>
  );
};
