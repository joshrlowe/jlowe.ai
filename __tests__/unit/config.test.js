/**
 * Tests for config utility
 * 
 * Tests environment configuration and validation functions.
 */

import { getConfig, getConfigValue, isProduction, isDevelopment } from '@/lib/config';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getConfig', () => {
    it('should return config object when all required env vars are set', () => {
      process.env.DATABASE_URL = 'postgresql://test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NODE_ENV = 'test';
      
      const config = getConfig();
      
      expect(config.databaseUrl).toBe('postgresql://test');
      expect(config.nextAuthSecret).toBe('test-secret');
      expect(config.nodeEnv).toBe('test');
    });

    it('should use PRISMA_DATABASE_URL as fallback for DATABASE_URL', () => {
      delete process.env.DATABASE_URL;
      process.env.PRISMA_DATABASE_URL = 'postgresql://prisma-test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      
      const config = getConfig();
      
      expect(config.databaseUrl).toBe('postgresql://prisma-test');
    });

    it('should throw error when DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;
      delete process.env.PRISMA_DATABASE_URL;
      process.env.NEXTAUTH_SECRET = 'test-secret';
      
      expect(() => getConfig()).toThrow('DATABASE_URL or PRISMA_DATABASE_URL must be set');
    });

    it('should throw error when NEXTAUTH_SECRET is missing', () => {
      process.env.DATABASE_URL = 'postgresql://test';
      delete process.env.NEXTAUTH_SECRET;
      
      expect(() => getConfig()).toThrow('NEXTAUTH_SECRET must be set');
    });

    it('should default to development when NODE_ENV is not set', () => {
      process.env.DATABASE_URL = 'postgresql://test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      delete process.env.NODE_ENV;
      
      const config = getConfig();
      
      expect(config.nodeEnv).toBe('development');
    });

    it('should use NEXTAUTH_URL when provided', () => {
      process.env.DATABASE_URL = 'postgresql://test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'https://custom-url.com';
      
      const config = getConfig();
      
      expect(config.nextAuthUrl).toBe('https://custom-url.com');
    });

    it('should construct URL from VERCEL_URL when NEXTAUTH_URL not set', () => {
      process.env.DATABASE_URL = 'postgresql://test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      delete process.env.NEXTAUTH_URL;
      process.env.VERCEL_URL = 'my-app.vercel.app';
      
      const config = getConfig();
      
      expect(config.nextAuthUrl).toBe('https://my-app.vercel.app');
    });

    it('should default to localhost when no URL env vars set', () => {
      process.env.DATABASE_URL = 'postgresql://test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      delete process.env.NEXTAUTH_URL;
      delete process.env.VERCEL_URL;
      
      const config = getConfig();
      
      expect(config.nextAuthUrl).toBe('http://localhost:3000');
    });

    it('should return mongodbUrl from MONGODB_URL', () => {
      process.env.DATABASE_URL = 'postgresql://test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.MONGODB_URL = 'mongodb://test';
      
      const config = getConfig();
      
      expect(config.mongodbUrl).toBe('mongodb://test');
    });

    it('should use MONGODB_URI as fallback for MONGODB_URL', () => {
      process.env.DATABASE_URL = 'postgresql://test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      delete process.env.MONGODB_URL;
      process.env.MONGODB_URI = 'mongodb://uri-test';
      
      const config = getConfig();
      
      expect(config.mongodbUrl).toBe('mongodb://uri-test');
    });

    it('should return null for mongodbUrl when not set', () => {
      process.env.DATABASE_URL = 'postgresql://test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      delete process.env.MONGODB_URL;
      delete process.env.MONGODB_URI;
      
      const config = getConfig();
      
      expect(config.mongodbUrl).toBeNull();
    });
  });

  describe('getConfigValue', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NODE_ENV = 'test';
    });

    it('should return specific config value by key', () => {
      expect(getConfigValue('databaseUrl')).toBe('postgresql://test');
      expect(getConfigValue('nextAuthSecret')).toBe('test-secret');
      expect(getConfigValue('nodeEnv')).toBe('test');
    });
  });

  describe('isProduction', () => {
    it('should return true when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      
      expect(isProduction()).toBe(true);
    });

    it('should return false when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      
      expect(isProduction()).toBe(false);
    });

    it('should return false when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      
      expect(isProduction()).toBe(false);
    });

    it('should return false when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      
      expect(isProduction()).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('should return true when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      
      expect(isDevelopment()).toBe(true);
    });

    it('should return true when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      
      expect(isDevelopment()).toBe(true);
    });

    it('should return false when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      
      expect(isDevelopment()).toBe(false);
    });

    it('should return false when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      
      expect(isDevelopment()).toBe(false);
    });
  });
});




