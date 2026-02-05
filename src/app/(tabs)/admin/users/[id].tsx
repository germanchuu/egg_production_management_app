/**
 * Edit User Screen
 *
 * Admin-only screen for editing existing users.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { UserCog, ArrowLeft, AlertCircle } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { UserForm, UserFormSkeleton } from '@/features/auth/components';
import { useUserFormActions } from '@/features/auth/hooks';
import { useToastContext } from '@/shared/contexts';
import type { User } from '@/shared/types/entities';

export default function EditUserScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { success, error: showError } = useToastContext();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form actions
  const { formLoading, handleEditUser } = useUserFormActions({
    onSuccess: () => {
      router.replace('/admin/users');
    },
    showToast: (message, type) => {
      if (type === 'success') success(message);
      else showError(message);
    },
  });

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      console.log('[EditUser] Loading user with ID:', id);

      if (!id) {
        console.error('[EditUser] No ID provided');
        setError('ID de usuario no proporcionado');
        setLoading(false);
        return;
      }

      // Handle array case (Expo Router can return string | string[])
      const userId = Array.isArray(id) ? id[0] : id;
      console.log('[EditUser] Resolved user ID:', userId);

      try {
        setLoading(true);
        setError(null);

        // Get user service
        const { UserServiceProvider } = await import(
          '@/features/auth/services/UserServiceProvider'
        );
        const userService = await UserServiceProvider.getUserService();
        const loadedUser = await userService.getUser(userId);

        console.log('[EditUser] Loaded user:', loadedUser ? 'found' : 'not found');

        if (!loadedUser) {
          setError('Usuario no encontrado');
        } else {
          setUser(loadedUser);
        }
      } catch (err) {
        console.error('[EditUser] Error loading user:', err);
        setError('Error al cargar el usuario');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id]);

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    if (!id) return;
    // Handle array case
    const userId = Array.isArray(id) ? id[0] : id;
    await handleEditUser(userId, data);
  };

  // Handle cancel
  const handleCancel = () => {
    router.replace('/admin/users');
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
        <ScrollView className="flex-1">
          {/* Header */}
          <View className="px-lg pt-xl pb-md border-b border-gray-200">
            <View className="flex-row items-center gap-md">
              <View className="w-6" />
              <View className="flex-1 flex-row items-center">
                <UserCog size={28} color={theme.colors.primary['500']} />
                <Text className="text-2xl font-bold text-textPrimary ml-md">
                  Editar Usuario
                </Text>
              </View>
            </View>
            <Text className="text-sm text-textSecondary mt-xs ml-10">
              Cargando información del usuario...
            </Text>
          </View>

          {/* Content */}
          <View className="px-lg py-md">
            <UserFormSkeleton />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-xl">
          <AlertCircle size={64} color={theme.colors.error.DEFAULT} />
          <Text className="text-lg font-semibold text-textPrimary mt-lg text-center">
            Error
          </Text>
          <Text className="text-sm text-textSecondary mt-sm text-center">
            {error || 'Usuario no encontrado'}
          </Text>
          <Pressable
            onPress={handleCancel}
            className="mt-xl bg-primary-500 px-lg py-md rounded-md"
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text className="text-white font-semibold">Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-lg pt-xl pb-md border-b border-gray-200">
          <View className="flex-row items-center gap-md">
            <Pressable
              onPress={handleCancel}
              hitSlop={8}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <ArrowLeft size={24} color={theme.colors.primary['500']} />
            </Pressable>
            <View className="flex-1 flex-row items-center">
              <UserCog size={28} color={theme.colors.primary['500']} />
              <Text className="text-2xl font-bold text-textPrimary ml-md">
                Editar Usuario
              </Text>
            </View>
          </View>
          <Text className="text-sm text-textSecondary mt-xs ml-10">
            Modificar la información del usuario
          </Text>
        </View>

        {/* Content */}
        <View className="px-lg py-md">
          <UserForm
            user={user}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            loading={formLoading}
            showCloseButton={false}
            showBorder={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
