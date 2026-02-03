import React from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import { XCircle, Info } from 'lucide-react-native';

interface InvalidInvitationProps {
  errorMessage: string;
}

export const InvalidInvitation: React.FC<InvalidInvitationProps> = ({
  errorMessage,
}) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 250 }}
      className="justify-center px-md"
    >
      {/* Icon + Title */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 250, delay: 50 }}
        className="flex-row items-center gap-md mb-md"
      >
        <View className="w-16 h-16 rounded-full bg-error/10 items-center justify-center">
          <XCircle size={32} color="#DC2626" />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-bold text-textPrimary">
            Invitación No Válida
          </Text>
          <Text className="text-sm text-textSecondary mt-xs">
            No pudimos validar tu invitación
          </Text>
        </View>
      </MotiView>

      {/* Error message */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 250, delay: 100 }}
        className="bg-primary/5 p-md border border-gray-300 rounded-md mb-md"
      >
        <Text className="text-xs text-textTertiary mb-xs">Motivo:</Text>
        <Text className="text-sm text-textPrimary font-medium">
          {errorMessage}
        </Text>
      </MotiView>

      {/* Help section */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 250, delay: 150 }}
        className="mb-sm py-3 border-y pt-3 border-primary/10"
      >
        <View className="flex flex-row items-center gap-2">
          <Info size={18} color="#0097A7" />
          <Text className="text-xs font-semibold text-textPrimary">
            ¿Qué puedes hacer?
          </Text>
        </View>
        <Text className="text-xs text-textSecondary mt-1">
          Solicita una nueva invitación al administrador
        </Text>
      </MotiView>

      {/* Footer note */}
      <Text className="text-xs text-textTertiary text-center">
        Las invitaciones expiran después de 7 días
      </Text>
    </MotiView>
  );
};

export default InvalidInvitation;
