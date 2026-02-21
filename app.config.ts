import { ExpoConfig } from '@expo/config-types';

const config: ExpoConfig = {
  name: 'Granja Avícola San Vicente de Paúl',
  slug: 'granja-avicola-svp',
  scheme: 'granjaavicola',
  version: '1.0.0',
  orientation: 'portrait',
  // TODO (T176): Replace with SVG-derived PNG icon once assets/logo.svg is added
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    // TODO (T176): Replace with SVG-derived splash image once assets/logo.svg is added
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
      // TODO (T176): Replace with SVG-derived foreground image once assets/logo.svg is added
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
      projectId: '7badc327-5849-46af-be22-9c66af4fe23b',
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
    url: 'https://u.expo.dev/7badc327-5849-46af-be22-9c66af4fe23b',
  },
};

export default config;
