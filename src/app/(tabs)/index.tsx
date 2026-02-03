import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, Dimensions, Pressable } from 'react-native';
import { useAuth } from '@/features/auth/contexts';
import { useSync } from '@/shared/hooks/useSync';
import { SyncStatusIndicator } from '@/shared/components/SyncStatusIndicator';

export default function HomeScreen() {
  const { user } = useAuth();
  const { status, pendingCount } = useSync();
  const { height } = Dimensions.get('window');

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ───────────────── Sync Status ───────────────── */}
      <View className="flex-row items-center justify-between px-lg py-sm">
        <SyncStatusIndicator status={status} pendingCount={pendingCount} />
      </View>

      {/* ───────────────── Content ───────────────── */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ───────────── Welcome Banner (40%) ───────────── */}
        <View
          className="
            bg-primary-600
            px-lg
            pt-3xl
            pb-xl
            rounded-b-xl
          "
          style={{ height: height * 0.4 }}
        >
          {/* User */}
          <View className="flex-row items-center gap-md">
            <View className="w-12 h-12 rounded-full bg-primary-400 items-center justify-center">
              <Text className="text-textInverse text-xl font-semibold">J</Text>
            </View>

            <View>
              <Text className="text-sm text-primary-100">Buenas noches</Text>
              <Text className="text-2xl font-bold text-textInverse">Juan</Text>
            </View>
          </View>

          {/* Role */}
          <View className="mt-sm self-start px-md py-xs rounded-full bg-primary-400">
            <Text className="text-xs font-medium text-textInverse">
              Administrador
            </Text>
          </View>

          {/* KPIs */}
          <View className="mt-xl pt-lg border-t border-primary-400 flex-row">
            <BannerKPI label="Lotes activos" value="8" />
            <BannerKPI label="Huevos hoy" value="1,234" />
            <BannerKPI label="Productividad" value="98%" />
          </View>
        </View>

        {/* ───────────── Metrics ───────────── */}
        <View className="px-lg mt-lg">
          <Text className="text-sm font-semibold text-textSecondary mb-md">
            DASHBOARD
          </Text>

          <View className="flex-row gap-md mb-md">
            <MetricCard
              title="Huevos hoy"
              value="1,234"
              trend="+5%"
              trendColor="text-success"
            />
            <MetricCard
              title="Tasa postura"
              value="94.5%"
              trend="+2%"
              trendColor="text-success"
            />
          </View>

          <View className="flex-row gap-md">
            <MetricCard
              title="Mortalidad hoy"
              value="3"
              trend="-1%"
              trendColor="text-error"
            />
            <MetricCard
              title="Alimento hoy"
              value="450 kg"
              trend="0%"
              trendColor="text-textSecondary"
            />
          </View>
        </View>

        {/* ───────────── Quick Actions ───────────── */}
        <View className="px-lg mt-xl">
          <Text className="text-sm font-semibold text-textSecondary mb-md">
            ACCIONES RÁPIDAS
          </Text>

          <View className="flex-row flex-wrap gap-md">
            <QuickAction
              title="Producción"
              subtitle="Registrar huevos"
              className="bg-primary-500"
            />
            <QuickAction
              title="Mortalidad"
              subtitle="Registrar bajas"
              className="bg-error"
            />
            <QuickAction
              title="Alimentación"
              subtitle="Registrar consumo"
              className="bg-accent-500"
            />
            <QuickAction
              title="Salud"
              subtitle="Eventos médicos"
              className="bg-info"
            />
          </View>
        </View>

        {/* ───────────── Administration ───────────── */}
        <View className="px-lg mt-xl mb-4xl">
          <Text className="text-sm font-semibold text-textSecondary mb-md">
            ADMINISTRACIÓN
          </Text>

          <AdminItem label="Gestión de Usuarios" />
          <AdminItem label="Gestión de Galpones" />
          <AdminItem label="Gestión de Lotes" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ───────────────── Components ───────────────── */

const BannerKPI = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-1 items-center">
    <Text className="text-xl font-bold text-textInverse">{value}</Text>
    <Text className="text-xs text-primary-100 mt-xs">{label}</Text>
  </View>
);

const MetricCard = ({
  title,
  value,
  trend,
  trendColor,
}: {
  title: string;
  value: string;
  trend: string;
  trendColor: string;
}) => (
  <View className="flex-1 bg-background rounded-lg p-lg shadow-card">
    <Text className="text-sm text-textSecondary">{title}</Text>
    <Text className="text-2xl font-bold text-textPrimary mt-xs">{value}</Text>
    <Text className={`text-xs mt-sm ${trendColor}`}>{trend}</Text>
  </View>
);

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
