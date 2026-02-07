/**
 * App Drawer Layout
 *
 * Main navigation using Drawer (no tabs).
 */

import { Drawer } from 'expo-router/drawer';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import { View, Text } from 'react-native';
import { Home, Package, User, Bug, Users } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { useAuth } from '@/features/auth/contexts';
import { UserRole } from '@/shared/types/entities';

/**
 * Drawer personalizado
 */
function CustomDrawerContent(props: any) {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.Admin;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View className="flex-1">
        <DrawerItemList {...props} />

        {isAdmin && (
          <>
            <View className="mt-auto px-4 pb-2">
              <Text className="text-xs font-semibold opacity-60">
                Administración
              </Text>
            </View>

            <DrawerItem
              label="Gestión de usuarios"
              onPress={() => props.navigation.navigate('admin/users/index')}
              icon={({ color, size }) => <Users size={size} color={color} />}
              labelStyle={{
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.textSecondary.DEFAULT,
              }}
            />
          </>
        )}
      </View>
    </DrawerContentScrollView>
  );
}

export default function AppLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.Admin;

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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
      {/* PRINCIPALES */}
      <Drawer.Screen
        name="index"
        options={{
          title: 'Inicio',
          drawerIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />

      <Drawer.Screen
        name="production"
        options={{
          title: 'Producción',
          drawerIcon: ({ color, size }) => (
            <Package size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="lots"
        options={{
          title: 'Lotes',
          drawerIcon: ({ color, size }) => (
            <Package size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="profile"
        options={{
          title: 'Perfil',
          drawerIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />

      {/* DEBUG - Solo visible para administradores */}
      <Drawer.Screen
        name="admin/debug"
        options={{
          title: '🛠️ Debug / Testing',
          drawerIcon: ({ color, size }) => <Bug size={size} color={color} />,
        }}
      />

      {/* ADMIN VISIBLE SOLO COMO ENTRY POINT - Solo registrado para administradores */}
      <Drawer.Screen
        name="admin/users/index"
        options={{
          title: 'Gestión de usuarios',
          drawerItemStyle: { display: 'none' },
        }}
      />

      {/* SUBRUTAS OCULTAS */}
      <Drawer.Screen
        name="admin/users/create"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="admin/users/[id]"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}
