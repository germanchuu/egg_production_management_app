import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '@/core/theme';

interface SubTabBarProps<T extends string> {
  tabs: T[];
  active: T;
  onChange: (tab: T) => void;
}

export function SubTabBar<T extends string>({ tabs, active, onChange }: SubTabBarProps<T>) {
  return (
    <View
      style={{
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
        {tabs.map((tab) => {
          const isActive = tab === active;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => onChange(tab)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={{ paddingHorizontal: 12, paddingVertical: 10, position: 'relative' }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '500',
                  color: isActive ? theme.colors.primary['600'] : theme.colors.gray['500'],
                }}
              >
                {tab}
              </Text>
              {isActive && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 12,
                    right: 12,
                    height: 2,
                    backgroundColor: theme.colors.primary['600'],
                    borderRadius: 1,
                  }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
