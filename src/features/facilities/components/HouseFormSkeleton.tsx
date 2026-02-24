/**
 * House Form Skeleton
 *
 * Loading skeleton for house creation/edit form
 */

import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';

export const HouseFormSkeleton: React.FC = () => {
  return (
    <View className="px-lg py-md space-y-lg">
      {/* Name Field */}
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
          className="h-4 w-24 bg-gray-200 rounded mb-xs"
        />
        {/* Input */}
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            delay: 100,
          }}
          className="h-12 bg-gray-200 rounded-md"
        />
      </View>

      {/* Description Field */}
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
          className="h-4 w-32 bg-gray-200 rounded mb-xs"
        />
        {/* Text Area (taller) */}
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            delay: 300,
          }}
          className="h-24 bg-gray-200 rounded-md"
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
          delay: 400,
        }}
        className="h-12 bg-gray-200 rounded-md"
      />
    </View>
  );
};
