/**
 * Tests for lib/config.js
 *
 * Tests environment configuration management
 */

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules before each test to get fresh config
    jest.resetModules();
    // Create a fresh copy of process.env
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getConfig', () => {
    it('should return config with all required values', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret-123';
      process.env.NODE_ENV = 'test';

      const { getConfig } = await import('../../lib/config.js');
      const config = getConfig();

      expect(config.databaseUrl).toBe('postgresql://localhost/test');
      expect(config.nextAuthSecret).toBe('test-secret-123');
      expect(config.nodeEnv).toBe('test');
    });

    it('should throw error when DATABASE_URL is missing', async () => {
      delete process.env.DATABASE_URL;
      delete process.env.PRISMA_DATABASE_URL;
      process.env.NEXTAUTH_SECRET = 'test-secret';

      const { getConfig } = await import('../../lib/config.js');

      expect(() => getConfig()).toThrow(
        'DATABASE_URL or PRISMA_DATABASE_URL must be set'
      );
    });

    it('should use PRISMA_DATABASE_URL as fallback', async () => {
      delete process.env.DATABASE_URL;
      process.env.PRISMA_DATABASE_URL = 'postgresql://prisma/db';
      process.env.NEXTAUTH_SECRET = 'test-secret';

      const { getConfig } = await import('../../lib/config.js');
      const config = getConfig();

      expect(config.databaseUrl).toBe('postgresql://prisma/db');
    });

    it('should throw error when NEXTAUTH_SECRET is missing', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      delete process.env.NEXTAUTH_SECRET;

      const { getConfig } = await import('../../lib/config.js');

      expect(() => getConfig()).toThrow(
        'NEXTAUTH_SECRET must be set'
      );
    });

    it('should use NEXTAUTH_URL when provided', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'https://myapp.com';

      const { getConfig } = await import('../../lib/config.js');
      const config = getConfig();

      expect(config.nextAuthUrl).toBe('https://myapp.com');
    });

    it('should use VERCEL_URL as fallback for nextAuthUrl', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      delete process.env.NEXTAUTH_URL;
      process.env.VERCEL_URL = 'myapp.vercel.app';

      const { getConfig } = await import('../../lib/config.js');
      const config = getConfig();

      expect(config.nextAuthUrl).toBe('https://myapp.vercel.app');
    });

    it('should default nextAuthUrl to localhost when no URL provided', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      delete process.env.NEXTAUTH_URL;
      delete process.env.VERCEL_URL;

      const { getConfig } = await import('../../lib/config.js');
      const config = getConfig();

      expect(config.nextAuthUrl).toBe('http://localhost:3000');
    });

    it('should default NODE_ENV to development', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      delete process.env.NODE_ENV;

      const { getConfig } = await import('../../lib/config.js');
      const config = getConfig();

      expect(config.nodeEnv).toBe('development');
    });

    it('should include mongodbUrl when MONGODB_URL is set', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.MONGODB_URL = 'mongodb://localhost/test';

      const { getConfig } = await import('../../lib/config.js');
      const config = getConfig();

      expect(config.mongodbUrl).toBe('mongodb://localhost/test');
    });

    it('should use MONGODB_URI as fallback for mongodbUrl', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      delete process.env.MONGODB_URL;
      process.env.MONGODB_URI = 'mongodb://uri/test';

      const { getConfig } = await import('../../lib/config.js');
      const config = getConfig();

      expect(config.mongodbUrl).toBe('mongodb://uri/test');
    });

    it('should set mongodbUrl to null when not provided', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      delete process.env.MONGODB_URL;
      delete process.env.MONGODB_URI;

      const { getConfig } = await import('../../lib/config.js');
      const config = getConfig();

      expect(config.mongodbUrl).toBeNull();
    });
  });

  describe('getConfigValue', () => {
    it('should return specific config value by key', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'my-secret';
      process.env.NODE_ENV = 'production';

      const { getConfigValue } = await import('../../lib/config.js');

      expect(getConfigValue('nextAuthSecret')).toBe('my-secret');
      expect(getConfigValue('nodeEnv')).toBe('production');
    });
  });

  describe('isProduction', () => {
    it('should return true in production environment', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NODE_ENV = 'production';

      const { isProduction } = await import('../../lib/config.js');

      expect(isProduction()).toBe(true);
    });

    it('should return false in development environment', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NODE_ENV = 'development';

      const { isProduction } = await import('../../lib/config.js');

      expect(isProduction()).toBe(false);
    });

    it('should return false in test environment', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NODE_ENV = 'test';

      const { isProduction } = await import('../../lib/config.js');

      expect(isProduction()).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('should return true in development environment', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NODE_ENV = 'development';

      const { isDevelopment } = await import('../../lib/config.js');

      expect(isDevelopment()).toBe(true);
    });

    it('should return true when NODE_ENV is not set', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      delete process.env.NODE_ENV;

      const { isDevelopment } = await import('../../lib/config.js');

      expect(isDevelopment()).toBe(true);
    });

    it('should return false in production environment', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NODE_ENV = 'production';

      const { isDevelopment } = await import('../../lib/config.js');

      expect(isDevelopment()).toBe(false);
    });

    it('should return false in test environment', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NODE_ENV = 'test';

      const { isDevelopment } = await import('../../lib/config.js');

      expect(isDevelopment()).toBe(false);
    });
  });
});

