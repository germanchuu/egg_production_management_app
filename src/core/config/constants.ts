/**
 * App Constants
 *
 * Re-exports configuration from app.json to be used throughout the app.
 * This provides type-safe access to app configuration with @ imports.
 */

import appConfig from '../../../app.json';

/**
 * App configuration (from app.json)
 */
export const APP_CONFIG = appConfig.expo;

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
export const IS_EXPO_GO = __DEV__ && typeof expo !== 'undefined';

/**
 * Get the base URL for deep links
 * Uses Expo Go URL in development, custom scheme in production
 */
export function getDeepLinkBase(): string {
  if (IS_EXPO_GO || __DEV__) {
    // Expo Go format: exp://192.168.1.10:8081/--/
    // Get from environment or use default
    const expoUrl = process.env.EXPO_PUBLIC_DEV_SERVER_URL || 'exp://192.168.1.10:8081';
    return `${expoUrl}/--`;
  }

  // Production: use custom scheme
  return `${APP_SCHEME}:/`;
}
