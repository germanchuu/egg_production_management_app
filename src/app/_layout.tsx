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

import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Slot, SplashScreen } from 'expo-router';
import { initDatabase } from '@/shared/database';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

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

        // Add a small delay to ensure splash screen shows briefly
        await new Promise((resolve) => setTimeout(resolve, 500));

        setInitState('ready');
      } catch (err) {
        setError(err as Error);
        setInitState('error');
      } finally {
        // Hide the splash screen once initialization is complete
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // Show loading state while initializing
  if (initState === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Iniciando</Text>
      </View>
    );
  }

  // Show error state if initialization failed
  if (initState === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-xl font-bold text-error mb-2">
          Error de Inicialización
        </Text>
        <Text className="text-gray-700 text-center mb-4">
          No se pudo inicializar la base de datos. Por favor, reinicia la
          aplicación.
        </Text>
        {error && (
          <Text className="text-sm text-gray-500 text-center">
            {error.message}
          </Text>
        )}
      </View>
    );
  }

  // Render the app once initialization is complete
  return <Slot />;
}
