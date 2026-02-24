/**
 * Environment Variables Loader Tests
 *
 * Tests for environment variables validation and loading.
 * env.ts reads Firebase config from Constants.expoConfig.extra (Expo config approach).
 */

const FULL_EXTRA = {
  firebaseApiKey: 'test-api-key',
  firebaseAuthDomain: 'test.firebaseapp.com',
  firebaseProjectId: 'test-project',
  firebaseStorageBucket: 'test.appspot.com',
  firebaseMessagingSenderId: '123456789',
  firebaseAppId: '1:123456789:web:abcdef',
  firebaseMeasurementId: 'G-XXXXXXXXXX',
};

function mockConstants(extra: Record<string, string | undefined>) {
  jest.doMock('expo-constants', () => ({
    default: { expoConfig: { extra } },
    expoConfig: { extra },
  }));
}

describe('Environment Variables', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('validateEnv', () => {
    it('should pass validation when all required Firebase vars are present', () => {
      mockConstants(FULL_EXTRA);
      const { validateEnv } = require('@/core/config/env');
      expect(() => validateEnv()).not.toThrow();
    });

    it('should throw error when firebaseApiKey is missing', () => {
      mockConstants({ ...FULL_EXTRA, firebaseApiKey: undefined });
      const { validateEnv } = require('@/core/config/env');
      expect(() => validateEnv()).toThrow();
    });

    it('should throw error when firebaseProjectId is missing', () => {
      mockConstants({ ...FULL_EXTRA, firebaseProjectId: undefined });
      const { validateEnv } = require('@/core/config/env');
      expect(() => validateEnv()).toThrow();
    });

    it('should throw error when multiple required variables are missing', () => {
      mockConstants({
        ...FULL_EXTRA,
        firebaseApiKey: undefined,
        firebaseProjectId: undefined,
      });
      const { validateEnv } = require('@/core/config/env');
      expect(() => validateEnv()).toThrow();
    });

    it('should allow optional firebaseMeasurementId to be missing', () => {
      const { firebaseMeasurementId: _, ...withoutMeasurement } = FULL_EXTRA;
      mockConstants(withoutMeasurement);
      const { validateEnv } = require('@/core/config/env');
      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe('getEnv', () => {
    it('should return all Firebase environment variables when valid', () => {
      mockConstants(FULL_EXTRA);
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
      const { firebaseMeasurementId: _, ...withoutMeasurement } = FULL_EXTRA;
      mockConstants(withoutMeasurement);
      const { getEnv } = require('@/core/config/env');
      const env = getEnv();
      expect(env.FIREBASE_MEASUREMENT_ID).toBeUndefined();
    });

    it('should throw error when trying to get env with missing required variables', () => {
      mockConstants({});
      const { getEnv } = require('@/core/config/env');
      expect(() => getEnv()).toThrow();
    });
  });
});
