/**
 * User Form Skeleton
 *
 * Loading skeleton for user form
 */

import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';

export const UserFormSkeleton: React.FC = () => {
  return (
    <View className="space-y-md">
      {/* Display Name Field */}
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
          className="h-4 w-32 bg-gray-200 rounded mb-xs"
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

      {/* Role Field */}
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
          className="h-4 w-20 bg-gray-200 rounded mb-xs"
        />
        {/* Buttons */}
        <View className="flex-row gap-sm">
          <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: 0.6 }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
              delay: 300,
            }}
            className="flex-1 h-10 bg-gray-200 rounded-md"
          />
          <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: 0.6 }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
              delay: 400,
            }}
            className="flex-1 h-10 bg-gray-200 rounded-md"
          />
        </View>
      </View>

      {/* Buttons */}
      <View className="flex-row gap-sm pt-md">
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            delay: 500,
          }}
          className="flex-1 h-12 bg-gray-200 rounded-md"
        />
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            delay: 600,
          }}
          className="flex-1 h-12 bg-gray-200 rounded-md"
        />
      </View>
    </View>
  );
};
