/**
 * Tabs Layout Component
 *
 * Main navigation layout with bottom tabs for primary app sections.
 *
 * Navigation Structure:
 * - Home: Dashboard with overview and quick actions
 * - Production: Daily egg production entry and history
 * - Lots: Chicken lots list and details
 * - Profile: User settings and account management
 *
 * Constitution III (Simplicity-First UX):
 * - Direct access to main features (≤3 levels navigation)
 * - Large touch targets for field use (48dp minimum)
 * - Clear iconography and labels in Spanish
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/core/theme';

/**
 * Tabs layout with bottom navigation using Tailwind theme
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary['500'],
        tabBarInactiveTintColor: theme.colors.gray['400'],
        tabBarStyle: {
          height: parseInt(theme.spacing['5xl']),
          paddingBottom: parseInt(theme.spacing.sm),
          paddingTop: parseInt(theme.spacing.sm),
        },
        tabBarLabelStyle: {
          fontSize: parseInt(theme.fontSize.xs[0]),
          fontWeight: theme.fontWeight.semibold,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary['500'],
        },
        headerTintColor: theme.colors['text-inverse'],
        headerTitleStyle: {
          fontWeight: theme.fontWeight.semibold,
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Production Tab */}
      <Tabs.Screen
        name="production"
        options={{
          title: 'Producción',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="egg" size={size} color={color} />
          ),
        }}
      />

      {/* Lots Tab */}
      <Tabs.Screen
        name="lots"
        options={{
          title: 'Lotes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
