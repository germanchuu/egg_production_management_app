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
    <View
      className="
        flex-row items-center
        bg-white
        border border-gray-300
        rounded-md
        px-md
        min-h-[48px]
      "
    >
      <Search size={18} color={theme.colors.textTertiary.DEFAULT} />
      <TextInput
        className="flex-1 ml-sm text-sm text-textPrimary"
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary.DEFAULT}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};
