/**
 * Lots Screen
 *
 * Chicken lots list and details.
 * Placeholder - to be implemented.
 */

import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Grid3x3 } from 'lucide-react-native';
import { theme } from '@/core/theme';

export default function LotsScreen() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-lg pt-xl pb-md border-b border-gray-200">
          <Text className="text-2xl font-bold text-textPrimary">Lotes</Text>
        </View>

        {/* Placeholder Content */}
        <View className="flex-1 items-center justify-center px-xl py-2xl">
          <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-lg">
            <Grid3x3 size={48} color={theme.colors.primary['500']} />
          </View>
          <Text className="text-xl font-semibold text-textPrimary text-center mb-sm">
            Gestión de Lotes
          </Text>
          <Text className="text-base text-textSecondary text-center">
            Pantalla en desarrollo
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
