import React from 'react';
import { View, Text } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Wheat, Package } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { useFeedingScreen } from '../contexts/FeedingScreenContext';
import { FeedingRecordTab } from './FeedingRecordTab';
import { FeedingBatchesTab } from './FeedingBatchesTab';

export type FeedingTabParamList = {
  Registrar: undefined;
  Lotes: undefined;
};

const Tab = createMaterialTopTabNavigator<FeedingTabParamList>();

// ─── BatchBadge ─────────────────────────────────────────────────────────────

const BatchBadge: React.FC<{ count: number }> = ({ count }) => (
  <View className="bg-primary-100 rounded-full px-1.5 py-0.5 min-w-[18px] items-center">
    <Text className="text-[11px] font-semibold text-primary-700">{count}</Text>
  </View>
);

// ─── Tab labels ─────────────────────────────────────────────────────────────

const RegisterLabel: React.FC<{ color: string }> = ({ color }) => (
  <Text className="text-[13px] font-medium normal-case" style={{ color }}>
    Registrar
  </Text>
);

const LotsLabel: React.FC<{ color: string; count: number }> = ({
  color,
  count,
}) => (
  <View className="flex-row items-center gap-1">
    <Text className="text-[13px] font-medium normal-case" style={{ color }}>
      Lotes de Alimento
    </Text>
    {count > 0 && <BatchBadge count={count} />}
  </View>
);

// ─── Navigator ──────────────────────────────────────────────────────────────

export const FeedingTabNavigator: React.FC = () => {
  const { feedBatches } = useFeedingScreen();
  const availableBatchCount = feedBatches.filter(
    (b) => b.remainingQuantityKg > 0
  ).length;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary['600'],
        tabBarInactiveTintColor: theme.colors.gray['500'],
        tabBarStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        },
        tabBarIndicatorStyle: {
          backgroundColor: theme.colors.primary['600'],
          height: 2,
        },
        tabBarPressColor: theme.colors.primary['100'],
        tabBarShowIcon: true,
        sceneStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Tab.Screen
        name="Registrar"
        component={FeedingRecordTab}
        options={{
          tabBarIcon: ({ color }) => <Wheat size={15} color={color} />,
          tabBarLabel: ({ color }) => <RegisterLabel color={color} />,
        }}
      />
      <Tab.Screen
        name="Lotes"
        component={FeedingBatchesTab}
        options={{
          tabBarIcon: ({ color }) => <Package size={15} color={color} />,
          tabBarLabel: ({ color }) => (
            <LotsLabel color={color} count={availableBatchCount} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
