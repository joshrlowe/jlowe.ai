/**
 * Tests for /api/admin/welcome.js
 *
 * Tests admin welcome data API route (PUT only)
 */

import welcomeHandler from '../../../pages/api/admin/welcome.js';
import prisma from '../../../lib/prisma.js';
import { getToken } from 'next-auth/jwt';
import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from '../../setup/api-test-utils.js';

// Mock prisma
jest.mock('../../../lib/prisma.js', () => ({
  __esModule: true,
  default: {
    welcome: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

describe('/api/admin/welcome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      getToken.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'PUT',
        body: { name: 'Test', briefBio: 'Bio' },
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(401);
      expect(getJsonResponse(res).message).toBe('Unauthorized');
    });
  });

  describe('PUT requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should update welcome data successfully', async () => {
      const newWelcome = {
        id: '1',
        name: 'Josh Lowe',
        briefBio: 'AI Engineer',
        callToAction: 'Building AI',
      };
      prisma.welcome.deleteMany.mockResolvedValue({ count: 1 });
      prisma.welcome.create.mockResolvedValue(newWelcome);

      const req = createMockRequest({
        method: 'PUT',
        body: {
          name: 'Josh Lowe',
          briefBio: 'AI Engineer',
          callToAction: 'Building AI',
        },
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(prisma.welcome.deleteMany).toHaveBeenCalled();
      expect(prisma.welcome.create).toHaveBeenCalledWith({
        data: {
          name: 'Josh Lowe',
          briefBio: 'AI Engineer',
          callToAction: 'Building AI',
        },
      });
      expect(getJsonResponse(res)).toEqual(newWelcome);
    });

    it('should return 400 when name is missing', async () => {
      const req = createMockRequest({
        method: 'PUT',
        body: { briefBio: 'Bio' },
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('Name and briefBio are required');
    });

    it('should return 400 when briefBio is missing', async () => {
      const req = createMockRequest({
        method: 'PUT',
        body: { name: 'Test' },
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('Name and briefBio are required');
    });

    it('should handle null callToAction', async () => {
      prisma.welcome.deleteMany.mockResolvedValue({ count: 0 });
      prisma.welcome.create.mockResolvedValue({
        id: '1',
        name: 'Test',
        briefBio: 'Bio',
        callToAction: null,
      });

      const req = createMockRequest({
        method: 'PUT',
        body: {
          name: 'Test',
          briefBio: 'Bio',
        },
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(prisma.welcome.create).toHaveBeenCalledWith({
        data: {
          name: 'Test',
          briefBio: 'Bio',
          callToAction: null,
        },
      });
    });

    it('should handle database errors', async () => {
      prisma.welcome.deleteMany.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'PUT',
        body: {
          name: 'Test',
          briefBio: 'Bio',
        },
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('HTTP method restrictions', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return 405 for GET requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for POST requests', async () => {
      const req = createMockRequest({ method: 'POST' });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it('should return 405 for DELETE requests', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });
});

