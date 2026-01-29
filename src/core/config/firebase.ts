/**
 * Firebase Configuration
 *
 * Initializes Firebase app with environment variables and exports
 * auth and firestore instances for use throughout the app.
 *
 * Usage:
 * ```typescript
 * import { auth, firestore } from '@/core/config/firebase';
 *
 * // Authentication
 * await signInWithEmailAndPassword(auth, email, password);
 *
 * // Firestore
 * const usersRef = collection(firestore, 'users');
 * const snapshot = await getDocs(usersRef);
 * ```
 */

import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  initializeAuth,
  // @ts-expect-error - getReactNativePersistence exists but TypeScript can't find it due to Metro bundler resolution (see: https://github.com/firebase/firebase-js-sdk/issues/7584)
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase configuration object
 *
 * Values are loaded from environment variables (EXPO_PUBLIC_FIREBASE_*)
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

/**
 * Validates Firebase configuration
 *
 * Ensures all required environment variables are present.
 * Throws error if any required variable is missing.
 */
function validateFirebaseConfig(): void {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingFields = requiredFields.filter(
    (field) => !firebaseConfig[field as keyof typeof firebaseConfig]
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missingFields.map((f) => `EXPO_PUBLIC_FIREBASE_${f.toUpperCase()}`).join(', ')}`
    );
  }
}

/**
 * Initializes Firebase app
 *
 * Creates or retrieves existing Firebase app instance.
 * Validates configuration before initialization.
 *
 * @returns Firebase app instance
 */
function initializeFirebaseApp(): FirebaseApp {
  // Validate configuration
  validateFirebaseConfig();

  try {
    // Try to get existing app instance
    return getApp();
  } catch {
    // App doesn't exist, initialize new one
    console.log('🔥 Initializing Firebase app...');
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');
    return app;
  }
}

/**
 * Initializes Firebase Auth with React Native persistence
 *
 * Uses AsyncStorage for auth state persistence across app restarts.
 *
 * @param app Firebase app instance
 * @returns Auth instance
 */
function initializeFirebaseAuth(app: FirebaseApp): Auth {
  try {
    // Try to get existing auth instance
    return getAuth(app);
  } catch {
    // Initialize auth with React Native persistence
    console.log(
      '🔐 Initializing Firebase Auth with AsyncStorage persistence...'
    );
    const auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    console.log('✅ Firebase Auth initialized');
    return auth;
  }
}

// Initialize Firebase app
const app = initializeFirebaseApp();

// Initialize Firebase Auth with React Native persistence
export const auth = initializeFirebaseAuth(app);

// Initialize Firestore
export const firestore = getFirestore(app);

// Export app for advanced use cases
export { app };

// Export types for convenience
export type { Auth, Firestore, FirebaseApp };
