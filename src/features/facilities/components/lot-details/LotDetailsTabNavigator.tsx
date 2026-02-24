import React from 'react';
import { Text } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Skull, Egg, Wheat, ShieldCheck } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { MortalityTab } from './MortalityTab';
import { ProductionTab } from './ProductionTab';
import { FeedingTab } from './FeedingTab';
import { HealthTab } from './HealthTab';

export type LotDetailsTabParamList = {
  Mortalidad: undefined;
  Producción: undefined;
  Alimentación: undefined;
  'Salud & Bio': undefined;
};

const Tab = createMaterialTopTabNavigator<LotDetailsTabParamList>();

const TabLabel: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <Text className="text-[13px] font-medium normal-case" style={{ color }}>
    {label}
  </Text>
);

export const LotDetailsTabNavigator: React.FC = () => (
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
      tabBarScrollEnabled: true,
      tabBarItemStyle: { width: 'auto', paddingHorizontal: 12 },
      sceneStyle: { backgroundColor: '#F9FAFB' },
    }}
  >
    <Tab.Screen
      name="Mortalidad"
      component={MortalityTab}
      options={{
        tabBarIcon: ({ color }) => <Skull size={15} color={color} />,
        tabBarLabel: ({ color }) => <TabLabel label="Mortalidad" color={color} />,
      }}
    />
    <Tab.Screen
      name="Producción"
      component={ProductionTab}
      options={{
        tabBarIcon: ({ color }) => <Egg size={15} color={color} />,
        tabBarLabel: ({ color }) => <TabLabel label="Producción" color={color} />,
      }}
    />
    <Tab.Screen
      name="Alimentación"
      component={FeedingTab}
      options={{
        tabBarIcon: ({ color }) => <Wheat size={15} color={color} />,
        tabBarLabel: ({ color }) => <TabLabel label="Alimentación" color={color} />,
      }}
    />
    <Tab.Screen
      name="Salud & Bio"
      component={HealthTab}
      options={{
        tabBarIcon: ({ color }) => <ShieldCheck size={15} color={color} />,
        tabBarLabel: ({ color }) => <TabLabel label="Salud & Bio" color={color} />,
      }}
    />
  </Tab.Navigator>
);
