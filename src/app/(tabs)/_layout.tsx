/**
 * App Drawer Layout
 *
 * Main navigation using Drawer (no tabs).
 */

import { Drawer } from 'expo-router/drawer';
import { Home, Package, User } from 'lucide-react-native';
import { theme } from '@/core/theme';

export default function AppLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: theme.colors.primary['500'],
        drawerInactiveTintColor: theme.colors.textSecondary.DEFAULT,
        drawerLabelStyle: {
          fontWeight: theme.fontWeight.medium,
        },
        drawerStyle: {
          backgroundColor: theme.colors.background.DEFAULT,
          width: 280,
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Inicio',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Home size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="production"
        options={{
          title: 'Producción',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Package size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="lots"
        options={{
          title: 'Lotes',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Package size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="profile"
        options={{
          title: 'Perfil',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
