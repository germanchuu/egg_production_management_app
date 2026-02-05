/**
 * Create User Screen
 *
 * Admin-only screen for creating new users.
 */

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UserPlus, ArrowLeft } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { UserForm } from '@/features/auth/components';
import { useUserFormActions } from '@/features/auth/hooks';
import { useToast } from '@/shared/hooks/useToast';
import { Toast } from '@/shared/components';

export default function CreateUserScreen() {
  const router = useRouter();
  const { toast, success, error, hide } = useToast();

  // Form actions
  const { formLoading, handleCreateUser } = useUserFormActions({
    onSuccess: () => {
      router.replace('/admin/users');
    },
    showToast: (message, type) => {
      if (type === 'success') success(message);
      else error(message);
    },
  });

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    await handleCreateUser(data);
  };

  // Handle cancel
  const handleCancel = () => {
    router.replace('/admin/users');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <Toast {...toast} onHide={hide} />

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
              <UserPlus size={28} color={theme.colors.primary['500']} />
              <Text className="text-2xl font-bold text-textPrimary ml-md">
                Crear Usuario
              </Text>
            </View>
          </View>
          <Text className="text-sm text-textSecondary mt-xs ml-10">
            Complete el formulario para crear un nuevo usuario
          </Text>
        </View>

        {/* Content */}
        <View className="px-lg py-md">
          <UserForm
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
