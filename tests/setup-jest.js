// Minimal Jest setup to avoid React Native setup issues
// This file is loaded BEFORE setupFilesAfterEnv

// React Native global
global.__DEV__ = false;

// Set up mock Firebase environment variables
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-domain.firebaseapp.com';
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-bucket.appspot.com';
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef';

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({}));

// Mock React Native modules that might cause issues
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
}));

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
