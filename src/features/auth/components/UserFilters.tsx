/**
 * User Filters Component
 *
 * Filter and sort controls for user list
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Filter, ArrowUpDown } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { AuthStatus, UserRole } from '@/shared/types/entities';

interface UserFiltersProps {
  authStatus: AuthStatus | 'all';
  role: UserRole | 'all';
  sortBy: 'name' | 'createdAt' | 'lastAccessAt';
  sortOrder: 'asc' | 'desc';
  onAuthStatusChange: (status: AuthStatus | 'all') => void;
  onRoleChange: (role: UserRole | 'all') => void;
  onSortByChange: (sortBy: 'name' | 'createdAt' | 'lastAccessAt') => void;
  onSortOrderToggle: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  authStatus,
  role,
  sortBy,
  sortOrder,
  onAuthStatusChange,
  onRoleChange,
  onSortByChange,
  onSortOrderToggle,
}) => {
  return (
    <View className="bg-white rounded-md shadow-sm border border-gray-100 p-md">
      {/* Header */}
      <View className="flex-row items-center mb-md">
        <Filter size={20} color={theme.colors.primary['500']} />
        <Text className="text-base font-semibold text-primary ml-sm">
          Filtros y Ordenación
        </Text>
      </View>

      {/* Auth Status Filter */}
      <View className="mb-md">
        <Text className="text-xs font-medium text-secondary mb-xs">
          Estado de Autenticación
        </Text>
        <View className="flex-row flex-wrap gap-xs">
          <FilterChip
            label="Todos"
            selected={authStatus === 'all'}
            onPress={() => onAuthStatusChange('all')}
          />
          <FilterChip
            label="Pendiente"
            selected={authStatus === AuthStatus.Pending}
            onPress={() => onAuthStatusChange(AuthStatus.Pending)}
          />
          <FilterChip
            label="Autenticado"
            selected={authStatus === AuthStatus.Authenticated}
            onPress={() => onAuthStatusChange(AuthStatus.Authenticated)}
          />
          <FilterChip
            label="Revocado"
            selected={authStatus === AuthStatus.Revoked}
            onPress={() => onAuthStatusChange(AuthStatus.Revoked)}
          />
        </View>
      </View>

      {/* Role Filter */}
      <View className="mb-md">
        <Text className="text-xs font-medium text-secondary mb-xs">
          Rol
        </Text>
        <View className="flex-row flex-wrap gap-xs">
          <FilterChip
            label="Todos"
            selected={role === 'all'}
            onPress={() => onRoleChange('all')}
          />
          <FilterChip
            label="Administrador"
            selected={role === UserRole.Admin}
            onPress={() => onRoleChange(UserRole.Admin)}
          />
          <FilterChip
            label="Usuario"
            selected={role === UserRole.User}
            onPress={() => onRoleChange(UserRole.User)}
          />
        </View>
      </View>

      {/* Sort Controls */}
      <View>
        <Text className="text-xs font-medium text-secondary mb-xs">
          Ordenar por
        </Text>
        <View className="flex-row items-center gap-xs">
          <View className="flex-1 flex-row flex-wrap gap-xs">
            <FilterChip
              label="Nombre"
              selected={sortBy === 'name'}
              onPress={() => onSortByChange('name')}
            />
            <FilterChip
              label="Creación"
              selected={sortBy === 'createdAt'}
              onPress={() => onSortByChange('createdAt')}
            />
            <FilterChip
              label="Último Acceso"
              selected={sortBy === 'lastAccessAt'}
              onPress={() => onSortByChange('lastAccessAt')}
            />
          </View>
          <Pressable
            onPress={onSortOrderToggle}
            className="w-10 h-10 items-center justify-center bg-primary-100 rounded-md"
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <ArrowUpDown
              size={20}
              color={theme.colors.primary['700']}
              style={{
                transform: [{ rotate: sortOrder === 'desc' ? '180deg' : '0deg' }],
              }}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Filter Chip                                   */
/* -------------------------------------------------------------------------- */

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, selected, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      className={`px-md py-xs rounded-full border ${
        selected
          ? 'bg-primary-500 border-primary-500'
          : 'bg-white border-gray-300'
      }`}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        className={`text-xs font-medium ${
          selected ? 'text-white' : 'text-secondary'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
};
