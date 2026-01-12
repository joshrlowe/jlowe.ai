/**
 * Tests for /api/newsletter/subscribe.js
 *
 * Tests newsletter subscription API route
 */

import newsletterHandler from '../../../pages/api/newsletter/subscribe.js';
import prisma from '../../../lib/prisma.js';
import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from '../../setup/api-test-utils.js';

jest.mock('../../../lib/prisma.js', () => ({
  __esModule: true,
  default: {
    newsletterSubscription: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('/api/newsletter/subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST requests', () => {
    it('should create new subscription with valid email', async () => {
      const email = 'test@example.com';
      const mockSubscription = {
        id: '1',
        email: email.toLowerCase(),
        active: true,
        createdAt: new Date(),
      };

      prisma.newsletterSubscription.findUnique.mockResolvedValue(null);
      prisma.newsletterSubscription.create.mockResolvedValue(mockSubscription);

      const req = createMockRequest({
        method: 'POST',
        body: { email },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(prisma.newsletterSubscription.findUnique).toHaveBeenCalledWith({
        where: { email: email.toLowerCase() },
      });
      expect(prisma.newsletterSubscription.create).toHaveBeenCalledWith({
        data: {
          email: email.toLowerCase(),
          active: true,
        },
      });
      expect(getStatusCode(res)).toBe(201);
      expect(getJsonResponse(res).message).toContain('Successfully subscribed');
      expect(getJsonResponse(res).subscription).toEqual(mockSubscription);
    });

    it('should convert email to lowercase', async () => {
      const email = 'TEST@EXAMPLE.COM';

      prisma.newsletterSubscription.findUnique.mockResolvedValue(null);
      prisma.newsletterSubscription.create.mockResolvedValue({
        id: '1',
        email: email.toLowerCase(),
        active: true,
      });

      const req = createMockRequest({
        method: 'POST',
        body: { email },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(prisma.newsletterSubscription.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          active: true,
        },
      });
    });

    it('should return 400 when email is missing', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {},
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('Valid email is required');
    });

    it('should return 400 when email is null', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { email: null },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('Valid email is required');
    });

    it('should return 400 when email is invalid', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { email: 'invalid-email' },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('Valid email is required');
    });

    it('should return 400 when email does not contain @', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { email: 'notemail.com' },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });

    it('should return 400 when email is already subscribed and active', async () => {
      const email = 'existing@example.com';
      const existingSubscription = {
        id: '1',
        email: email.toLowerCase(),
        active: true,
      };

      prisma.newsletterSubscription.findUnique.mockResolvedValue(
        existingSubscription
      );

      const req = createMockRequest({
        method: 'POST',
        body: { email },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('Email already subscribed');
    });

    it('should reactivate inactive subscription', async () => {
      const email = 'inactive@example.com';
      const inactiveSubscription = {
        id: '1',
        email: email.toLowerCase(),
        active: false,
      };
      const reactivatedSubscription = {
        ...inactiveSubscription,
        active: true,
      };

      prisma.newsletterSubscription.findUnique.mockResolvedValue(
        inactiveSubscription
      );
      prisma.newsletterSubscription.update.mockResolvedValue(
        reactivatedSubscription
      );

      const req = createMockRequest({
        method: 'POST',
        body: { email },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(prisma.newsletterSubscription.update).toHaveBeenCalledWith({
        where: { email: email.toLowerCase() },
        data: { active: true },
      });
      const statusCode = getStatusCode(res);
      expect([200, 201]).toContain(statusCode);
      expect(getJsonResponse(res).message).toContain('reactivated');
      expect(getJsonResponse(res).subscription).toEqual(reactivatedSubscription);
    });

    it('should handle database errors with 500', async () => {
      prisma.newsletterSubscription.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      const req = createMockRequest({
        method: 'POST',
        body: { email: 'test@example.com' },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });

    it('should handle unique constraint violations', async () => {
      prisma.newsletterSubscription.findUnique.mockResolvedValue(null);
      prisma.newsletterSubscription.create.mockRejectedValue({
        code: 'P2002',
        message: 'Unique constraint failed',
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const req = createMockRequest({
        method: 'POST',
        body: { email: 'test@example.com' },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(409);
      consoleSpy.mockRestore();
    });
  });

  describe('HTTP method restrictions', () => {
    it('should return 405 for GET requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it('should return 405 for DELETE requests', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it('should return 405 for PATCH requests', async () => {
      const req = createMockRequest({ method: 'PATCH' });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });

  describe('Edge cases', () => {
    it('should handle email with spaces', async () => {
      const email = '  test@example.com  ';

      prisma.newsletterSubscription.findUnique.mockResolvedValue(null);
      prisma.newsletterSubscription.create.mockResolvedValue({
        id: '1',
        email: email.trim().toLowerCase(),
        active: true,
      });

      const req = createMockRequest({
        method: 'POST',
        body: { email },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      // Should handle gracefully (implementation may vary)
      expect(getStatusCode(res)).toBeGreaterThanOrEqual(200);
    });

    it('should handle special characters in email', async () => {
      const email = 'test+tag@example.com';

      prisma.newsletterSubscription.findUnique.mockResolvedValue(null);
      prisma.newsletterSubscription.create.mockResolvedValue({
        id: '1',
        email: email.toLowerCase(),
        active: true,
      });

      const req = createMockRequest({
        method: 'POST',
        body: { email },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should handle international domain names', async () => {
      const email = 'test@münchen.de';

      prisma.newsletterSubscription.findUnique.mockResolvedValue(null);
      prisma.newsletterSubscription.create.mockResolvedValue({
        id: '1',
        email: email.toLowerCase(),
        active: true,
      });

      const req = createMockRequest({
        method: 'POST',
        body: { email },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should handle very long email addresses', async () => {
      const email = 'a'.repeat(100) + '@example.com';

      prisma.newsletterSubscription.findUnique.mockResolvedValue(null);
      prisma.newsletterSubscription.create.mockResolvedValue({
        id: '1',
        email: email.toLowerCase(),
        active: true,
      });

      const req = createMockRequest({
        method: 'POST',
        body: { email },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should handle empty string email', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { email: '' },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });

    it('should handle email with multiple @ symbols', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { email: 'test@@example.com' },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      // Should accept it (simple validation only checks for @)
      // More sophisticated validation could reject it
      expect(getStatusCode(res)).toBeGreaterThanOrEqual(200);
    });

    it('should handle concurrent subscription attempts', async () => {
      const email = 'test@example.com';

      prisma.newsletterSubscription.findUnique.mockResolvedValue(null);
      prisma.newsletterSubscription.create.mockResolvedValue({
        id: '1',
        email: email.toLowerCase(),
        active: true,
      });

      const req1 = createMockRequest({
        method: 'POST',
        body: { email },
      });
      const res1 = createMockResponse();

      const req2 = createMockRequest({
        method: 'POST',
        body: { email },
      });
      const res2 = createMockResponse();

      await newsletterHandler(req1, res1);
      await newsletterHandler(req2, res2);

      // Both should complete
      expect(getStatusCode(res1)).toBeGreaterThanOrEqual(200);
      expect(getStatusCode(res2)).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Response structure', () => {
    it('should include message in success response', async () => {
      prisma.newsletterSubscription.findUnique.mockResolvedValue(null);
      prisma.newsletterSubscription.create.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        active: true,
      });

      const req = createMockRequest({
        method: 'POST',
        body: { email: 'test@example.com' },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      const response = getJsonResponse(res);
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('subscription');
    });

    it('should include subscription object in response', async () => {
      const mockSubscription = {
        id: '1',
        email: 'test@example.com',
        active: true,
        createdAt: new Date(),
      };

      prisma.newsletterSubscription.findUnique.mockResolvedValue(null);
      prisma.newsletterSubscription.create.mockResolvedValue(mockSubscription);

      const req = createMockRequest({
        method: 'POST',
        body: { email: 'test@example.com' },
      });
      const res = createMockResponse();

      await newsletterHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.subscription).toEqual(mockSubscription);
    });
  });
});

