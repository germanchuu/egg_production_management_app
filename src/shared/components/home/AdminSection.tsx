import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  Warehouse,
  Bird,
  LucideIcon,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuth } from '@/features/auth/contexts';
import { UserRole } from '@/shared/types/entities';

export function AdminSection() {
  const { user } = useAuth();
  const router = useRouter();

  if (user?.role !== UserRole.Admin) {
    return null;
  }

  const adminActions = [
    {
      icon: Users,
      label: 'Gestión de Usuarios',
      onPress: () => router.push('/admin/users'),
    },
    {
      icon: Warehouse,
      label: 'Gestión de Galpones',
      onPress: () => router.push('/admin/houses'),
    },
    {
      icon: Bird,
      label: 'Gestión de Lotes',
      onPress: () => router.push('/lots'),
    },
  ];

  return (
    <Animated.View entering={FadeIn} className="space-y-3">
      <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wide mb-md">
        Administración
      </Text>

      <View className="gap-y-2">
        {adminActions.map((action) => (
          <AdminAction key={action.label} {...action} />
        ))}
      </View>
    </Animated.View>
  );
}

interface AdminActionProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AdminAction({ icon: Icon, label, onPress }: AdminActionProps) {
  return (
    <AnimatedPressable
      entering={FadeIn}
      onPress={onPress}
      className="
        flex-row items-center gap-3 w-full p-4
        bg-background rounded-xl
        border border-gray-200
        shadow-card
      "
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
    >
      {/* Icon container */}
      <View className="h-10 w-10 rounded-lg bg-background-secondary items-center justify-center">
        <Icon size={20} color={'#212121'} />
      </View>

      {/* Label */}
      <Text className="flex-1 font-medium text-textPrimary">{label}</Text>

      {/* Chevron */}
      <ChevronRight size={20} color={'#212121'} />
    </AnimatedPressable>
  );
}
