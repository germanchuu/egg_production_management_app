/**
 * House Card Skeleton
 *
 * Loading skeleton for house card display
 */

import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';

export const HouseCardSkeleton: React.FC = () => {
  return (
    <View className="bg-white rounded-md p-lg border border-gray-200 shadow-sm">
      {/* Name */}
      <MotiView
        from={{ opacity: 0.3 }}
        animate={{ opacity: 0.6 }}
        transition={{
          type: 'timing',
          duration: 1000,
          loop: true,
          repeatReverse: true,
        }}
        className="h-6 w-3/4 bg-gray-200 rounded mb-xs"
      />

      {/* Description */}
      <MotiView
        from={{ opacity: 0.3 }}
        animate={{ opacity: 0.6 }}
        transition={{
          type: 'timing',
          duration: 1000,
          loop: true,
          repeatReverse: true,
          delay: 100,
        }}
        className="h-4 w-full bg-gray-200 rounded mb-xs"
      />
      <MotiView
        from={{ opacity: 0.3 }}
        animate={{ opacity: 0.6 }}
        transition={{
          type: 'timing',
          duration: 1000,
          loop: true,
          repeatReverse: true,
          delay: 150,
        }}
        className="h-4 w-1/2 bg-gray-200 rounded mb-md"
      />

      {/* Created Date */}
      <MotiView
        from={{ opacity: 0.3 }}
        animate={{ opacity: 0.6 }}
        transition={{
          type: 'timing',
          duration: 1000,
          loop: true,
          repeatReverse: true,
          delay: 200,
        }}
        className="h-3 w-1/3 bg-gray-200 rounded"
      />
    </View>
  );
};
