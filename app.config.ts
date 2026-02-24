import { ExpoConfig } from '@expo/config-types';

const config: ExpoConfig = {
  name: 'Granja Avícola San Vicente de Paúl',
  slug: 'granja-avicola-svp',
  owner: 'germanchuu',
  scheme: 'granjaavicola',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    jsEngine: 'hermes',
    bundleIdentifier: 'com.germanchuu.granja-avicola-svp',
  },
  android: {
    jsEngine: 'hermes',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    softwareKeyboardLayoutMode: 'pan',
    intentFilters: [
      {
        action: 'VIEW',
        data: [{ scheme: 'granjaavicola' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'gestion-huevos-app.vercel.app',
            pathPrefix: '/invite',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
    package: 'com.germanchuu.granja_avicola_svp',
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-router', 'expo-sqlite', 'expo-secure-store'],
  extra: {
    router: {},
    eas: {
      projectId: 'e74b380a-e203-4686-8063-882cbf0f082c',
    },
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: 'https://u.expo.dev/e74b380a-e203-4686-8063-882cbf0f082c',
  },
};

export default config;
