/**
 * Root Index Screen
 *
 * Entry point for the app. Decides routing based on auth state:
 * - If authenticated → Redirect to /tabs (main app)
 * - If not authenticated → Show WaitingForInvitation screen
 *
 * Deep link invitations bypass this and go directly to /auth/invite/[token]
 */

import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/contexts';
import { WaitingForInvitation } from '@/features/auth/components';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  // Show loading state while checking auth
  if (isLoading) {
    return null; // SplashScreen handles loading UI
  }

  // If authenticated, redirect to main app
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // Not authenticated → Show waiting screen
  return <WaitingForInvitation />;
}
