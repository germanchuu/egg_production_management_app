import Constants from 'expo-constants';

export interface Env {
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;
  FIREBASE_MEASUREMENT_ID?: string;
}

const extra = Constants.expoConfig?.extra as any;

export function validateEnv(): void {
  if (
    !extra?.firebaseApiKey ||
    !extra?.firebaseAuthDomain ||
    !extra?.firebaseProjectId ||
    !extra?.firebaseStorageBucket ||
    !extra?.firebaseMessagingSenderId ||
    !extra?.firebaseAppId
  ) {
    throw new Error('Firebase env vars missing in expoConfig.extra');
  }
}

export function getEnv(): Env {
  validateEnv();

  return {
    FIREBASE_API_KEY: extra.firebaseApiKey,
    FIREBASE_AUTH_DOMAIN: extra.firebaseAuthDomain,
    FIREBASE_PROJECT_ID: extra.firebaseProjectId,
    FIREBASE_STORAGE_BUCKET: extra.firebaseStorageBucket,
    FIREBASE_MESSAGING_SENDER_ID: extra.firebaseMessagingSenderId,
    FIREBASE_APP_ID: extra.firebaseAppId,
    FIREBASE_MEASUREMENT_ID: extra.firebaseMeasurementId,
  };
}
