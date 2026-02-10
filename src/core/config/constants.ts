/**
 * App Constants
 *
 * Re-exports configuration from app.config.ts to be used throughout the app.
 * This provides type-safe access to app configuration with @ imports.
 */

import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

/**
 * App configuration (from app.config.ts via expo-constants)
 */
export const APP_CONFIG = Constants.expoConfig!

/**
 * Deep link scheme
 */
export const APP_SCHEME = APP_CONFIG.scheme;

/**
 * App name
 */
export const APP_NAME = APP_CONFIG.name;

/**
 * App slug
 */
export const APP_SLUG = APP_CONFIG.slug;

/**
 * App version
 */
export const APP_VERSION = APP_CONFIG.version;

/**
 * Check if running in Expo Go
 */
export const IS_EXPO_GO = Constants.appOwnership === 'expo';

/**
 * Check if running in development mode
 */
export const IS_DEV = __DEV__;

/**
 * Production domain for HTTPS deep links (Android App Links)
 * Update this with your Vercel domain
 */
export const PRODUCTION_DOMAIN = 'gestion-huevos-app.vercel.app';

/**
 * Generate a deep link URL
 *
 * Behavior:
 * - Expo Go: exp://[host]:[port]/--/[path]
 * - Development Build: {scheme}://[path]
 * - Production Build: https://[domain]/[path]
 *
 * @param path - The path for the deep link (e.g., "invite/abc123")
 * @returns Complete deep link URL
 *
 * @example
 * ```typescript
 * generateDeepLink('invite/token123')
 * // Expo Go: exp://192.168.1.10:8081/--/invite/token123
 * // Dev Build: gestionproduccionhuevos://invite/token123
 * // Production: https://gestion-huevos-app.vercel.app/invite/token123
 * ```
 */
export function generateDeepLink(path: string): string {
  // Just for the moment
  return `https://${PRODUCTION_DOMAIN}/${path}`;

  // Expo Go or Development Build: use custom scheme
  if (IS_EXPO_GO || IS_DEV) {
    return Linking.createURL(path);
  }

  // Production Build: use HTTPS (Android App Links)
  return `https://${PRODUCTION_DOMAIN}/${path}`;
}
