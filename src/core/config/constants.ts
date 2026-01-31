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
