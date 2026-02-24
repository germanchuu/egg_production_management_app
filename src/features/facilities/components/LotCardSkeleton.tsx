/**
 * Lot Card Skeleton
 *
 * Loading skeleton for lot card display with stats grid
 */

import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';

export const LotCardSkeleton: React.FC = () => {
  return (
    <View className="bg-white rounded-md p-lg border border-gray-200 shadow-sm">
      {/* Header Row - Name + Status Badge */}
      <View className="flex-row justify-between items-start mb-sm">
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            repeatReverse: true,
          }}
          className="h-6 w-2/3 bg-gray-200 rounded"
        />
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
          className="h-6 w-16 bg-gray-200 rounded-sm"
        />
      </View>

      {/* Location Row */}
      <View className="flex-row items-center gap-xs mb-md">
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
          className="h-4 w-4 bg-gray-200 rounded"
        />
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            repeatReverse: true,
            delay: 250,
          }}
          className="h-4 w-32 bg-gray-200 rounded"
        />
      </View>

      {/* Stats Grid - 3 columns */}
      <View className="flex-row justify-between">
        {/* Live Hens Column */}
        <View className="flex-1">
          <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: 0.6 }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
              repeatReverse: true,
              delay: 300,
            }}
            className="h-3 w-24 bg-gray-200 rounded mb-xs"
          />
          <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: 0.6 }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
              repeatReverse: true,
              delay: 350,
            }}
            className="h-8 w-16 bg-gray-200 rounded mb-xs"
          />
          <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: 0.6 }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
              repeatReverse: true,
              delay: 400,
            }}
            className="h-3 w-20 bg-gray-200 rounded"
          />
        </View>

        {/* Age Column */}
        <View className="flex-1">
          <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: 0.6 }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
              repeatReverse: true,
              delay: 450,
            }}
            className="h-3 w-16 bg-gray-200 rounded mb-xs"
          />
          <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: 0.6 }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
              repeatReverse: true,
              delay: 500,
            }}
            className="h-8 w-12 bg-gray-200 rounded mb-xs"
          />
          <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: 0.6 }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
              repeatReverse: true,
              delay: 550,
            }}
            className="h-3 w-16 bg-gray-200 rounded"
          />
        </View>

        {/* Mortality Column */}
        <View className="flex-1">
          <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: 0.6 }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
              repeatReverse: true,
              delay: 600,
            }}
            className="h-3 w-20 bg-gray-200 rounded mb-xs"
          />
          <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: 0.6 }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
              repeatReverse: true,
              delay: 650,
            }}
            className="h-8 w-16 bg-gray-200 rounded"
          />
        </View>
      </View>
    </View>
  );
};
