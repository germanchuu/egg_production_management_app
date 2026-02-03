/**
 * Auth Layout Component
 *
 * Navigation layout for authentication-related flows.
 *
 * Routes:
 * - invite/[token]: Deep link invitation acceptance screen
 *
 * Authentication Flow (Constitution IV - Invitation-Based Auth):
 * 1. Admin creates user in system (authStatus='pending')
 * 2. Admin generates deep link invitation (myapp://invite/[token])
 * 3. Admin shares invitation via native share sheet
 * 4. User opens deep link and accepts invitation
 * 5. Device session stored locally (expo-secure-store)
 * 6. User marked as 'authenticated' in Firestore
 *
 * Constitution III (Simplicity-First UX):
 * - Single-purpose flow (invitation acceptance only)
 * - Clear feedback on invitation status
 * - No login screen, no email input, no passwords
 */

import { Stack } from 'expo-router';
import { theme } from '@/core/theme';

/**
 * Auth stack navigation with deep link invitation route
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Invitation Acceptance Route */}
      <Stack.Screen name="invite/[token]" />
    </Stack>
  );
}
