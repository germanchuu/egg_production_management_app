import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, Pressable, RefreshControl } from 'react-native';
import { SyncStatusIndicator } from '@/shared/components/SyncStatusIndicator';
import { UserHeader } from '@/shared/components/home/UserHeader';
import { MetricSection } from '@/shared/components/home/MetricSection';
import React from 'react';
import { QuickActionSection } from '@/shared/components/home/QuickActionSection';
import { AdminSection } from '@/shared/components/home/AdminSection';
import { useSyncContext } from '@/shared/contexts/SyncContext';

export default function HomeScreen() {
  const { sync, status } = useSyncContext();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Small delay to let Firestore sync with server before reading
    // This ensures we read fresh data instead of stale cache
    await new Promise(resolve => setTimeout(resolve, 500));
    // Fast sync: Uses listeners to detect inserts/updates from other users (5-10s)
    // Deletion detection happens automatically every 7 days in deep refresh
    await sync(false);
    setRefreshing(false);
  }, [sync]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* ───────────────── Sync Status ───────────────── */}
      <View className="flex-row items-center justify-between px-lg py-sm">
        <SyncStatusIndicator />
      </View>

      <View className="px-lg flex-1">
        {/* ───────────────── Content ───────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0EA5E9"
              colors={['#0EA5E9']}
            />
          }
        >
          {/* ───────────── Welcome Banner ───────────── */}
          <View className="mt-2 mb-6">
            <UserHeader />
          </View>

          {/* ───────────── Metrics ───────────── */}
          <View className="gap-6">
            <MetricSection />

            {/* ───────────── Quick Actions ───────────── */}
            <QuickActionSection />

            {/* ───────────── Administration ───────────── */}
            <AdminSection />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ───────────────── Components ───────────────── */

const QuickAction = ({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle: string;
  className: string;
}) => (
  <Pressable
    className={`
      w-[48%]
      rounded-lg
      p-lg
      shadow-button
      ${className}
    `}
  >
    <Text className="text-base font-semibold text-textInverse">{title}</Text>
    <Text className="text-xs text-textInverse mt-xs">{subtitle}</Text>
  </Pressable>
);

const AdminItem = ({ label }: { label: string }) => (
  <Pressable
    className="
    bg-background
    rounded-lg
    px-lg
    py-md
    shadow-card
    mb-sm
    flex-row
    justify-between
    items-center
  "
  >
    <Text className="text-base text-textPrimary">{label}</Text>
    <Text className="text-textTertiary">›</Text>
  </Pressable>
);
