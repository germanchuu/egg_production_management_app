/**
 * Mortality Form Skeleton
 *
 * Loading skeleton for mortality form
 */

import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';

export const MortalityFormSkeleton: React.FC = () => {
  return (
    <View className="px-lg py-md space-y-lg">
      {/* Lot Picker Field */}
      <View>
        {/* Label */}
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
          }}
          className="h-4 w-20 bg-gray-200 rounded mb-xs"
        />
        {/* Picker */}
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            delay: 100,
          }}
          className="h-32 bg-gray-200 rounded-md"
        />
      </View>

      {/* Date Field */}
      <View>
        {/* Label */}
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            delay: 200,
          }}
          className="h-4 w-24 bg-gray-200 rounded mb-xs"
        />
        {/* Date Picker */}
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            delay: 300,
          }}
          className="h-12 bg-gray-200 rounded-md"
        />
      </View>

      {/* Hens Died Field */}
      <View>
        {/* Label */}
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            delay: 400,
          }}
          className="h-4 w-40 bg-gray-200 rounded mb-xs"
        />
        {/* Input */}
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            delay: 500,
          }}
          className="h-12 bg-gray-200 rounded-md"
        />
      </View>

      {/* Submit Button */}
      <MotiView
        from={{ opacity: 0.3 }}
        animate={{ opacity: 0.6 }}
        transition={{
          type: 'timing',
          duration: 1000,
          loop: true,
          delay: 600,
        }}
        className="h-12 bg-gray-200 rounded-md"
      />
    </View>
  );
};
