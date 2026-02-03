/**
 * User Form Component
 *
 * Form for creating and editing users using React Hook Form + Zod
 * Follows offline-first pattern: saves to SQLite, then syncs to Firebase
 */

import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { MotiView } from 'moti';
import { User as UserIcon, Shield, X } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { theme } from '@/core/theme';
import { UserRole } from '@/shared/types/entities';
import type { User } from '@/shared/types/entities';
import { displayNameSchema } from '@/shared/utils/validation';
import { Button } from '@/shared/components';

/* -------------------------------------------------------------------------- */
/*                              Validation Schema                             */
/* -------------------------------------------------------------------------- */

const userFormSchema = z.object({
  displayName: displayNameSchema,
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Selecciona un rol válido' }),
  }),
});

export type UserFormData = z.infer<typeof userFormSchema>;

/* -------------------------------------------------------------------------- */
/*                                User Form                                   */
/* -------------------------------------------------------------------------- */

interface UserFormProps {
  user?: User; // If editing, pass the user
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const isEditing = !!user;

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      role: user?.role || UserRole.User,
    },
  });

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 250 }}
      className="bg-white rounded-md shadow-sm border border-gray-100 p-lg"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-lg">
        <View className="flex-row items-center">
          <UserIcon size={24} color={theme.colors.primary['500']} />
          <Text className="text-lg font-bold text-textPrimary ml-sm">
            {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Text>
        </View>
        <Pressable
          onPress={onCancel}
          className="w-8 h-8 items-center justify-center"
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <X size={20} color={theme.colors.gray['600']} />
        </Pressable>
      </View>

      {/* Display Name Input */}
      <View className="mb-md">
        <Text className="text-sm font-medium text-textSecondary mb-xs">
          Nombre del Usuario
        </Text>
        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <View className="flex-row items-center border border-gray-300 rounded-md px-md py-sm">
                <UserIcon size={20} color={theme.colors.gray['400']} />
                <TextInput
                  className="flex-1 ml-sm text-base text-textPrimary"
                  placeholder="Ej: Juan Pérez"
                  placeholderTextColor={theme.colors.gray['400']}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
              {errors.displayName && (
                <Text className="text-xs text-error mt-xs">
                  {errors.displayName.message}
                </Text>
              )}
            </View>
          )}
        />
      </View>

      {/* Role Selection */}
      <View className="mb-lg">
        <Text className="text-sm font-medium text-textSecondary mb-xs">
          Rol del Usuario
        </Text>
        <Controller
          control={control}
          name="role"
          render={({ field: { onChange, value } }) => (
            <View>
              <View className="flex-row gap-md">
                {/* User Role */}
                <Pressable
                  onPress={() => onChange(UserRole.User)}
                  disabled={loading}
                  className={`flex-1 flex-row items-center justify-center gap-sm px-md py-md rounded-md border ${
                    value === UserRole.User
                      ? 'bg-primary-500 border-primary-500'
                      : 'bg-white border-gray-300'
                  }`}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <UserIcon
                    size={20}
                    color={
                      value === UserRole.User
                        ? '#FFFFFF'
                        : theme.colors.gray['600']
                    }
                  />
                  <Text
                    className={`text-sm font-medium ${
                      value === UserRole.User
                        ? 'text-white'
                        : 'text-textSecondary'
                    }`}
                  >
                    Usuario
                  </Text>
                </Pressable>

                {/* Admin Role */}
                <Pressable
                  onPress={() => onChange(UserRole.Admin)}
                  disabled={loading}
                  className={`flex-1 flex-row items-center justify-center gap-sm px-md py-md rounded-md border ${
                    value === UserRole.Admin
                      ? 'bg-secondary-500 border-secondary-500'
                      : 'bg-white border-gray-300'
                  }`}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Shield
                    size={20}
                    color={
                      value === UserRole.Admin
                        ? '#FFFFFF'
                        : theme.colors.gray['600']
                    }
                  />
                  <Text
                    className={`text-sm font-medium ${
                      value === UserRole.Admin
                        ? 'text-white'
                        : 'text-textSecondary'
                    }`}
                  >
                    Administrador
                  </Text>
                </Pressable>
              </View>
              <Text className="text-xs text-textTertiary mt-xs">
                {value === UserRole.Admin
                  ? 'Los administradores pueden gestionar usuarios y configuración del sistema.'
                  : 'Los usuarios pueden registrar producción, mortalidad y otros eventos.'}
              </Text>
              {errors.role && (
                <Text className="text-xs text-error mt-xs">
                  {errors.role.message}
                </Text>
              )}
            </View>
          )}
        />
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-md">
        <View className="flex-1">
          <Button variant="secondary" onPress={onCancel} disabled={loading}>
            Cancelar
          </Button>
        </View>
        <View className="flex-1">
          <Button
            variant="primary"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading}
          >
            {isEditing ? 'Actualizar' : 'Crear Usuario'}
          </Button>
        </View>
      </View>

      {/* Info Note */}
      {!isEditing && (
        <View className="mt-md bg-primary-50 p-sm rounded-md border border-primary-200">
          <Text className="text-xs text-textPrimary-700">
            El usuario será creado en estado "Pendiente". Deberás generar una
            invitación para que pueda acceder a la aplicación.
          </Text>
        </View>
      )}
    </MotiView>
  );
};
