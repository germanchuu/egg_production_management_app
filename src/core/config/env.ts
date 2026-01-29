/**
 * Environment Variables Loader
 *
 * Validates and loads environment variables for Firebase configuration.
 * Ensures all required EXPO_PUBLIC_FIREBASE_* variables are present.
 *
 * Usage:
 * ```typescript
 * import { getEnv, validateEnv } from '@/core/config/env';
 *
 * // Validate on app startup
 * validateEnv();
 *
 * // Get validated environment variables
 * const env = getEnv();
 * console.log(env.FIREBASE_API_KEY);
 * ```
 */

/**
 * Environment variables interface
 */
export interface Env {
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;
  FIREBASE_MEASUREMENT_ID?: string; // Optional
}

/**
 * Required Firebase environment variable keys
 */
const REQUIRED_ENV_VARS = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
] as const;

/**
 * Optional Firebase environment variable keys
 */
const OPTIONAL_ENV_VARS = ['EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'] as const;

/**
 * Validates that all required Firebase environment variables are present
 *
 * @throws Error if any required environment variable is missing
 */
export function validateEnv(): void {
  const missingVars: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please ensure all EXPO_PUBLIC_FIREBASE_* variables are set in your .env file.'
    );
  }
}

/**
 * Gets validated environment variables
 *
 * @returns Validated environment variables
 * @throws Error if any required environment variable is missing
 */
export function getEnv(): Env {
  validateEnv();

  return {
    FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
    FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
    FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    FIREBASE_MESSAGING_SENDER_ID:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
    FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}
