/**
 * Lot Form Skeleton
 *
 * Loading skeleton for lot creation/edit form
 */

import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';

export const LotFormSkeleton: React.FC = () => {
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

      {/* House Picker Field */}
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
        {/* Picker (taller for multiple options) */}
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            delay: 300,
          }}
          className="h-32 bg-gray-200 rounded-md"
        />
      </View>

      {/* Purchase Date Field */}
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
          className="h-4 w-36 bg-gray-200 rounded mb-xs"
        />
        {/* Date Picker */}
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

      {/* Initial Hen Count Field */}
      <View>
        {/* Label */}
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            delay: 600,
          }}
          className="h-4 w-48 bg-gray-200 rounded mb-xs"
        />
        {/* Input */}
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            delay: 700,
          }}
          className="h-12 bg-gray-200 rounded-md"
        />
      </View>

      {/* Age Weeks Field */}
      <View>
        {/* Label */}
        <MotiView
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            delay: 800,
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
            delay: 900,
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
          delay: 1000,
        }}
        className="h-12 bg-gray-200 rounded-md"
      />
    </View>
  );
};
