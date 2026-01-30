import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Button } from '@/shared/components';

export interface InvitationConfirmationProps {
  userName: string;
  onAccept: () => void;
  loading?: boolean;
  error?: string | null;
}

export const InvitationConfirmation: React.FC<InvitationConfirmationProps> = ({
  userName,
  onAccept,
  loading = false,
  error = null,
}) => {
  return (
    <View className="flex-1 bg-background px-xl py-2xl justify-center">
      <View className="bg-background rounded-lg p-2xl shadow-card">
        <Text className="text-2xl font-bold text-text-primary mb-lg text-center">
          Confirmación de Invitación
        </Text>

        <Text className="text-base text-text-secondary mb-4xl text-center">
          Esta es una invitación para:
        </Text>

        <View className="bg-background-tertiary rounded-md p-xl mb-4xl">
          <Text className="text-xl font-semibold text-primary text-center">
            {userName}
          </Text>
        </View>

        {error && (
          <View className="bg-error/10 border border-error rounded-md p-md mb-3xl">
            <Text className="text-sm text-error text-center">{error}</Text>
          </View>
        )}

        <Button
          onPress={onAccept}
          disabled={loading}
          className="bg-primary rounded-md py-md"
        >
          {loading ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text className="text-base font-semibold text-text-inverse ml-sm">
                Aceptando...
              </Text>
            </View>
          ) : (
            <Text className="text-base font-semibold text-text-inverse text-center">
              Aceptar Invitación
            </Text>
          )}
        </Button>
      </View>
    </View>
  );
};
