import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';

export const UserCardSkeleton = () => {
  return (
    <MotiView
      from={{ opacity: 0.3 }}
      animate={{ opacity: 1 }}
      transition={{
        type: 'timing',
        duration: 600,
        loop: true,
        repeatReverse: true,
      }}
      className="flex-row items-center bg-gray-100 rounded-md p-md mb-sm"
    >
      {/* Avatar circle */}
      <View className="w-12 h-12 bg-gray-300 rounded-full" />

      {/* Text placeholders */}
      <View className="ml-md flex-1">
        <View className="h-3 bg-gray-300 rounded-full w-3/4 mb-2" />
        <View className="h-3 bg-gray-300 rounded-full w-1/2" />
      </View>
    </MotiView>
  );
};
