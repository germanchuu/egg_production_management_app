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
import {
  Home,
  RefreshCw,
  Users,
  ClipboardList,
  Warehouse,
  Bird,
  BarChart3,
  Wheat,
  ShieldCheck,
} from 'lucide-react-native';
import { theme } from '@/core/theme';
import { useAuth } from '@/features/auth/contexts';
import { UserRole } from '@/shared/types/entities';

/**
 * Drawer personalizado
 */
function AdminDrawerContent(props: any) {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.Admin;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View className="flex-1">
        <DrawerItemList {...props} />

        {isAdmin && (
          <>
            <View className="mt-auto px-4 pb-2 pt-4">
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

            <DrawerItem
              label="Galpones"
              onPress={() => props.navigation.navigate('admin/houses/index')}
              icon={({ color, size }) => (
                <Warehouse size={size} color={color} />
              )}
              labelStyle={{
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.textSecondary.DEFAULT,
              }}
            />

            <DrawerItem
              label="Lotes"
              onPress={() => props.navigation.navigate('lots/index')}
              icon={({ color, size }) => <Bird size={size} color={color} />}
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
  return (
    <Drawer
      drawerContent={(props) => <AdminDrawerContent {...props} />}
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
        name="production/index"
        options={{
          title: 'Producción',
          drawerIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="mortality/index"
        options={{
          title: 'Mortalidad',
          drawerIcon: ({ color, size }) => (
            <ClipboardList size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="feeding/index"
        options={{
          title: 'Alimentación',
          drawerIcon: ({ color, size }) => <Wheat size={size} color={color} />,
        }}
      />

      <Drawer.Screen
        name="health/index"
        options={{
          title: 'Salud & Bioseguridad',
          drawerIcon: ({ color, size }) => (
            <ShieldCheck size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="admin/debug"
        options={{
          title: 'Sincronización',
          drawerIcon: ({ color, size }) => <RefreshCw size={size} color={color} />,
        }}
      />

      {/* ADMIN - Screens renderizados en CustomDrawerContent */}
      <Drawer.Screen
        name="admin/houses/index"
        options={{
          title: 'Galpones',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="lots/index"
        options={{
          title: 'Lotes',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="admin/users/index"
        options={{
          title: 'Gestión de usuarios',
          drawerItemStyle: { display: 'none' },
        }}
      />

      {/* SUBRUTAS OCULTAS - HOUSES */}
      <Drawer.Screen
        name="admin/houses/create"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="admin/houses/[id]"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />

      {/* SUBRUTAS OCULTAS - LOTS */}
      <Drawer.Screen
        name="lots/create"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="mortality/[id]/edit"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="production/[id]/edit"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="lots/[id]/edit"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="lots/[lotId]"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />

      {/* SUBRUTAS OCULTAS - USERS */}
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
