import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  AlertTriangle,
  Wheat,
  Heart,
  LucideIcon,
} from 'lucide-react-native';

export function QuickActionSection() {
  const router = useRouter();

  const actions = [
    {
      icon: BarChart3,
      label: 'Producción',
      description: 'Registrar huevos',
      onPress: () => router.push('/production'),
      variant: 'primary' as const,
    },
    {
      icon: AlertTriangle,
      label: 'Mortalidad',
      description: 'Registrar bajas',
      onPress: () => router.push('/mortality'),
      variant: 'warning' as const,
    },
    {
      icon: Wheat,
      label: 'Alimentación',
      description: 'Registrar consumo',
      onPress: () => router.push('/feeding'),
      variant: 'success' as const,
    },
    {
      icon: Heart,
      label: 'Salud',
      description: 'Eventos médicos',
      onPress: () => router.push('/health'),
      variant: 'info' as const,
    },
  ];

  return (
    <View className="space-y-3">
      <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wide mb-md">
        Acciones Rápidas
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {actions.map((action) => (
          <View key={action.label} className="w-[48%]">
            <QuickAction {...action} />
          </View>
        ))}
      </View>
    </View>
  );
}

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  description: string;
  onPress: () => void;
  variant: 'primary' | 'warning' | 'success' | 'info';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function QuickAction({
  icon: Icon,
  label,
  description,
  onPress,
  variant,
}: QuickActionProps) {
  const variantStyles = {
    primary: 'bg-primary',
    warning: 'bg-error',
    success: 'bg-success',
    info: 'bg-info',
  };

  return (
    <AnimatedPressable
      entering={FadeIn}
      onPress={onPress}
      className={`
        flex-1 min-h-[120px]
        items-center justify-center gap-2 p-4
        rounded-xl shadow-button
        ${variantStyles[variant]}
      `}
      android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
    >
      <Icon size={28} color="#FFFFFF" />

      <View className="items-center">
        <Text className="font-semibold text-sm text-textInverse">{label}</Text>
        <Text className="text-xs opacity-80 mt-0.5 text-textInverse text-center">
          {description}
        </Text>
      </View>
    </AnimatedPressable>
  );
}
