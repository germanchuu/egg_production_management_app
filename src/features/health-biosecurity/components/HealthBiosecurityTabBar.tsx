import React from 'react';
import { View, Text } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Syringe, Shield } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { HealthEventTab } from './HealthEventTab';
import { BiosecurityEventTab } from './BiosecurityEventTab';

export type HealthBiosecurityTabParamList = {
  Salud: undefined;
  Bioseguridad: undefined;
};

const Tab = createMaterialTopTabNavigator<HealthBiosecurityTabParamList>();

// ─── Tab labels ─────────────────────────────────────────────────────────────

const SaludLabel: React.FC<{ color: string }> = ({ color }) => (
  <Text className="text-[13px] font-medium normal-case" style={{ color }}>
    Salud
  </Text>
);

const BioseguridadLabel: React.FC<{ color: string }> = ({ color }) => (
  <View className="flex-row items-center gap-1">
    <Text className="text-[13px] font-medium normal-case" style={{ color }}>
      Bioseguridad
    </Text>
  </View>
);

// ─── Navigator ──────────────────────────────────────────────────────────────

export const HealthBiosecurityTabNavigator: React.FC = () => (
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
      name="Salud"
      component={HealthEventTab}
      options={{
        tabBarIcon: ({ color }) => <Syringe size={15} color={color} />,
        tabBarLabel: ({ color }) => <SaludLabel color={color} />,
      }}
    />
    <Tab.Screen
      name="Bioseguridad"
      component={BiosecurityEventTab}
      options={{
        tabBarIcon: ({ color }) => <Shield size={15} color={color} />,
        tabBarLabel: ({ color }) => <BioseguridadLabel color={color} />,
      }}
    />
  </Tab.Navigator>
);
