/**
 * User Search Bar Component
 *
 * Search input for filtering users by name
 */

import React from 'react';
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import { theme } from '@/core/theme';

interface UserSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const UserSearchBar: React.FC<UserSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Buscar usuarios...',
}) => {
  return (
    <View className="flex-row items-center bg-white border border-gray-300 rounded-md px-md py-sm">
      <Search size={20} color={theme.colors.gray['400']} />
      <TextInput
        className="flex-1 ml-sm text-base text-primary"
        placeholder={placeholder}
        placeholderTextColor={theme.colors.gray['400']}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};
