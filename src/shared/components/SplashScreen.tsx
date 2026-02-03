import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export interface SplashScreenProps {
  isLoading?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isLoading = true,
}) => {
  return (
    <View className="flex-1 bg-primary items-center justify-center">
      <View className="items-center">
        <Text className="text-5xl mb-3xl">🥚</Text>

        <Text className="text-4xl font-bold text-text-textInverse mb-md text-center">
          Gestión de Huevos
        </Text>

        <Text className="text-lg text-text-textInverse/90 mb-5xl text-center">
          Sistema de producción avícola
        </Text>

        {isLoading && (
          <ActivityIndicator size="large" color="#FFFFFF" className="mb-3xl" />
        )}
      </View>

      <View className="absolute bottom-4xl">
        <Text className="text-sm text-text-textInverse/70 text-center">
          Versión 1.0.0
        </Text>
      </View>
    </View>
  );
};
