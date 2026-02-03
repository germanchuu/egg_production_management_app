/**
 * Production Screen
 *
 * Daily egg production entry and history.
 * Placeholder - to be implemented.
 */

import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Egg } from 'lucide-react-native';
import { theme } from '@/core/theme';

export default function ProductionScreen() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-lg pt-xl pb-md border-b border-gray-200">
          <Text className="text-2xl font-bold text-textPrimary">
            Producción
          </Text>
        </View>

        {/* Placeholder Content */}
        <View className="flex-1 items-center justify-center px-xl py-2xl">
          <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-lg">
            <Egg size={48} color={theme.colors.primary['500']} />
          </View>
          <Text className="text-xl font-semibold text-textPrimary text-center mb-sm">
            Producción Diaria
          </Text>
          <Text className="text-base text-textSecondary text-center">
            Pantalla en desarrollo
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
