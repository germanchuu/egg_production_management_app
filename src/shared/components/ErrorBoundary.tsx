/**
 * ErrorBoundary Component (T158)
 *
 * Catches React render errors gracefully and shows a user-friendly
 * Spanish error screen instead of a blank/crashed UI.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <SomeScreen />
 * </ErrorBoundary>
 *
 * // With custom fallback:
 * <ErrorBoundary fallback={<Text>Algo salió mal</Text>}>
 *   <SomeScreen />
 * </ErrorBoundary>
 * ```
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle } from 'lucide-react-native';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback UI */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView
          edges={['top', 'bottom']}
          className="flex-1 bg-background"
        >
          <View className="flex-1 items-center justify-center px-xl py-2xl">
            <View className="w-20 h-20 rounded-full bg-error/10 items-center justify-center mb-lg">
              <AlertTriangle size={40} color="#EF4444" />
            </View>

            <Text className="text-xl font-bold text-textPrimary text-center mb-sm">
              Algo salió mal
            </Text>

            <Text className="text-base text-textSecondary text-center mb-xl">
              Ocurrió un error inesperado en esta pantalla. Tus datos están
              seguros.
            </Text>

            <Pressable
              onPress={this.handleRetry}
              className="bg-primary-500 px-xl py-md rounded-md min-h-[48px] items-center justify-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              accessibilityRole="button"
              accessibilityLabel="Reintentar"
            >
              <Text className="text-white text-base font-semibold">
                Reintentar
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
