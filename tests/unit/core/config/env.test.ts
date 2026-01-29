/**
 * Environment Variables Loader Tests
 *
 * Tests for environment variables validation and loading.
 */

describe('Environment Variables', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to get fresh env
    jest.resetModules();
    // Clone original env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should pass validation when all required Firebase vars are present', () => {
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef';

      const { validateEnv } = require('@/core/config/env');

      expect(() => validateEnv()).not.toThrow();
    });

    it('should throw error when EXPO_PUBLIC_FIREBASE_API_KEY is missing', () => {
      delete process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef';

      const { validateEnv } = require('@/core/config/env');

      expect(() => validateEnv()).toThrow('EXPO_PUBLIC_FIREBASE_API_KEY');
    });

    it('should throw error when EXPO_PUBLIC_FIREBASE_PROJECT_ID is missing', () => {
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
      delete process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef';

      const { validateEnv } = require('@/core/config/env');

      expect(() => validateEnv()).toThrow('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
    });

    it('should throw error listing all missing required variables', () => {
      delete process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
      delete process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef';

      const { validateEnv } = require('@/core/config/env');

      expect(() => validateEnv()).toThrow('EXPO_PUBLIC_FIREBASE_API_KEY');
      expect(() => validateEnv()).toThrow('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
    });

    it('should allow optional EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID to be missing', () => {
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef';
      delete process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID;

      const { validateEnv } = require('@/core/config/env');

      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe('getEnv', () => {
    it('should return all Firebase environment variables when valid', () => {
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef';
      process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID = 'G-XXXXXXXXXX';

      const { getEnv } = require('@/core/config/env');
      const env = getEnv();

      expect(env.FIREBASE_API_KEY).toBe('test-api-key');
      expect(env.FIREBASE_AUTH_DOMAIN).toBe('test.firebaseapp.com');
      expect(env.FIREBASE_PROJECT_ID).toBe('test-project');
      expect(env.FIREBASE_STORAGE_BUCKET).toBe('test.appspot.com');
      expect(env.FIREBASE_MESSAGING_SENDER_ID).toBe('123456789');
      expect(env.FIREBASE_APP_ID).toBe('1:123456789:web:abcdef');
      expect(env.FIREBASE_MEASUREMENT_ID).toBe('G-XXXXXXXXXX');
    });

    it('should return undefined for optional FIREBASE_MEASUREMENT_ID when not set', () => {
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef';
      delete process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID;

      const { getEnv } = require('@/core/config/env');
      const env = getEnv();

      expect(env.FIREBASE_MEASUREMENT_ID).toBeUndefined();
    });

    it('should throw error when trying to get env with missing required variables', () => {
      delete process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

      const { getEnv } = require('@/core/config/env');

      expect(() => getEnv()).toThrow();
    });
  });
});
