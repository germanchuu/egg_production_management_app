import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Wheat, Package } from 'lucide-react-native';
import { theme } from '@/core/theme';

export type FeedingTab = 'record' | 'batches';

interface FeedingTabBarProps {
  activeTab: FeedingTab;
  onTabChange: (tab: FeedingTab) => void;
  availableBatchCount: number;
}

export const FeedingTabBar: React.FC<FeedingTabBarProps> = ({
  activeTab,
  onTabChange,
  availableBatchCount,
}) => (
  <View className="flex-row bg-gray-100 rounded-lg p-xs mt-md">
    <Pressable
      className={`flex-1 flex-row items-center justify-center gap-xs py-sm rounded-md ${
        activeTab === 'record' ? 'bg-white shadow-sm' : ''
      }`}
      onPress={() => onTabChange('record')}
    >
      <Wheat
        size={15}
        color={activeTab === 'record' ? theme.colors.primary['600'] : theme.colors.gray['500']}
      />
      <Text
        className={`text-sm font-medium ${
          activeTab === 'record' ? 'text-primary-600' : 'text-textSecondary'
        }`}
      >
        Registrar
      </Text>
    </Pressable>

    <Pressable
      className={`flex-1 flex-row items-center justify-center gap-xs py-sm rounded-md ${
        activeTab === 'batches' ? 'bg-white shadow-sm' : ''
      }`}
      onPress={() => onTabChange('batches')}
    >
      <Package
        size={15}
        color={activeTab === 'batches' ? theme.colors.primary['600'] : theme.colors.gray['500']}
      />
      <Text
        className={`text-sm font-medium ${
          activeTab === 'batches' ? 'text-primary-600' : 'text-textSecondary'
        }`}
      >
        Lotes de Alimento
      </Text>
      {availableBatchCount > 0 && (
        <View className="bg-primary-100 rounded-full px-xs">
          <Text className="text-xs font-semibold text-primary-700">{availableBatchCount}</Text>
        </View>
      )}
    </Pressable>
  </View>
);
