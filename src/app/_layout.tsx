/**
 * Root Layout Component
 *
 * Expo Router root layout that handles:
 * - Database initialization on app mount
 * - Global app state and context providers
 * - Error handling for initialization failures
 * - Loading states during app startup
 *
 * This layout wraps all screens in the application and ensures
 * the database is ready before rendering any content.
 *
 * Constitution I (Offline-First): Database is initialized immediately
 * on app launch to enable offline functionality from the start.
 */

import '../../global.css';
import 'react-native-reanimated';

import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Slot, SplashScreen as ExpoSplashScreen } from 'expo-router';
import { initDatabase } from '@/shared/database';
import { SplashScreen, ErrorBoundary } from '@/shared/components';
import { AuthProvider } from '@/features/auth/contexts';
import { ToastProvider, SyncProvider } from '@/shared/contexts';
// Prevent the splash screen from auto-hiding
ExpoSplashScreen.preventAutoHideAsync();

/**
 * Initialization states
 */
type InitState = 'loading' | 'ready' | 'error';

/**
 * Root layout component with database initialization
 */
export default function RootLayout() {
  const [initState, setInitState] = useState<InitState>('loading');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize SQLite database with schema
        await initDatabase();

        setInitState('ready');
      } catch (err) {
        setError(err as Error);
        setInitState('error');
      } finally {
        // Hide the splash screen once initialization is complete
        await ExpoSplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // Show loading state while initializing
  if (initState === 'loading') {
    return <SplashScreen isLoading={true} />;
  }

  // Show error state if initialization failed
  if (initState === 'error') {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-xl py-2xl">
          <Text className="text-xl font-bold text-error mb-md">
            Error de Inicialización
          </Text>
          <Text className="text-textPrimary text-center mb-lg">
            No se pudo inicializar la base de datos. Por favor, reinicia la
            aplicación.
          </Text>
          {error && (
            <Text className="text-sm text-textTertiary text-center">
              {error.message}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SyncProvider>
          <ToastProvider>
            <Slot />
          </ToastProvider>
        </SyncProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
