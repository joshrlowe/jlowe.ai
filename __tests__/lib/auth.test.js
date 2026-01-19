/**
 * Tests for lib/auth.js
 *
 * Tests authentication helper functions
 */

// Mock next-auth/jwt
const mockGetToken = jest.fn();
jest.mock('next-auth/jwt', () => ({
  getToken: mockGetToken,
}));

// Mock next-auth/next
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock lib/config
const mockGetConfigValue = jest.fn(() => 'test-secret');
jest.mock('../../lib/config.js', () => ({
  getConfigValue: mockGetConfigValue,
}));

// Mock next-auth handler
jest.mock('../../pages/api/auth/[...nextauth].js', () => ({}), { virtual: true });

import { requireAuth, getAdminSession } from '../../lib/auth.js';

describe('auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should always return props object', async () => {
      const context = { req: {}, res: {} };

      const result = await requireAuth(context);

      expect(result).toEqual({ props: {} });
    });

    it('should work with any context', async () => {
      const context = {
        req: { headers: { cookie: 'session=abc' } },
        res: {},
        params: { id: '123' },
      };

      const result = await requireAuth(context);

      expect(result).toEqual({ props: {} });
    });

    it('should not throw errors', async () => {
      await expect(requireAuth({})).resolves.not.toThrow();
    });
  });

  describe('getAdminSession', () => {
    it('should return null when no token exists', async () => {
      mockGetToken.mockResolvedValue(null);
      const req = { headers: {} };
      const res = {};

      const result = await getAdminSession(req, res);

      expect(result).toBeNull();
      expect(mockGetToken).toHaveBeenCalledWith({
        req,
        secret: 'test-secret',
      });
    });

    it('should return session with user data when token exists', async () => {
      mockGetToken.mockResolvedValue({
        id: 'user-123',
        email: 'admin@example.com',
        role: 'admin',
      });
      const req = { headers: { authorization: 'Bearer token' } };
      const res = {};

      const result = await getAdminSession(req, res);

      expect(result).toEqual({
        user: {
          id: 'user-123',
          email: 'admin@example.com',
          role: 'admin',
        },
      });
    });

    it('should use nextAuthSecret from config', async () => {
      mockGetToken.mockResolvedValue(null);
      const req = { headers: {} };
      const res = {};

      await getAdminSession(req, res);

      expect(mockGetConfigValue).toHaveBeenCalledWith('nextAuthSecret');
    });

    it('should handle token with minimal data', async () => {
      mockGetToken.mockResolvedValue({
        id: 'user-456',
        email: 'user@example.com',
      });
      const req = { headers: {} };
      const res = {};

      const result = await getAdminSession(req, res);

      expect(result).toEqual({
        user: {
          id: 'user-456',
          email: 'user@example.com',
          role: undefined,
        },
      });
    });

    it('should handle token with extra properties', async () => {
      mockGetToken.mockResolvedValue({
        id: 'user-789',
        email: 'test@example.com',
        role: 'editor',
        exp: 1234567890,
        iat: 1234567800,
        name: 'Test User',
      });
      const req = { headers: {} };
      const res = {};

      const result = await getAdminSession(req, res);

      // Should only return id, email, and role
      expect(result).toEqual({
        user: {
          id: 'user-789',
          email: 'test@example.com',
          role: 'editor',
        },
      });
    });
  });
});

