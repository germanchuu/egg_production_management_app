/**
 * ProductionFormSkeleton Component
 *
 * Loading skeleton for ProductionEntryForm.
 * Shows placeholder UI while data is loading.
 */

import React from 'react';
import { View } from 'react-native';

export const ProductionFormSkeleton: React.FC = () => {
  return (
    <View className="space-y-4 px-lg py-md">
      {/* Lot Selector Skeleton */}
      <View>
        <View className="h-4 bg-gray-200 rounded w-16 mb-xs" />
        <View className="h-12 bg-gray-200 rounded-md" />
      </View>

      {/* Date Picker Skeleton */}
      <View>
        <View className="h-4 bg-gray-200 rounded w-12 mb-xs" />
        <View className="h-12 bg-gray-200 rounded-md" />
      </View>

      {/* Eggs Collected Input Skeleton */}
      <View>
        <View className="h-4 bg-gray-200 rounded w-32 mb-xs" />
        <View className="h-12 bg-gray-200 rounded-md" />
        <View className="h-3 bg-gray-100 rounded w-24 mt-xs" />
      </View>

      {/* Buttons Skeleton */}
      <View className="flex-row gap-md mt-md">
        <View className="flex-1 h-12 bg-gray-200 rounded-md" />
        <View className="flex-1 h-12 bg-gray-300 rounded-md" />
      </View>
    </View>
  );
};
