/**
 * Tests for /api/welcome/index
 *
 * Tests welcome data API route
 */

import welcomeHandler from '../../../pages/api/welcome/index';
import prisma from '../../../lib/prisma';
import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from '../../setup/api-test-utils.js';

jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    welcome: {
      findFirst: jest.fn(),
    },
  },
}));

describe('/api/welcome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validWelcomeData = {
    name: 'Josh Lowe',
    briefBio: 'AI/ML Engineer building production systems',
    callToAction: 'View My Projects',
  };

  describe('GET requests', () => {
    it('should return latest welcome data with 200', async () => {
      const mockWelcome = {
        id: '1',
        ...validWelcomeData,
        createdAt: new Date(),
      };

      prisma.welcome.findFirst.mockResolvedValue(mockWelcome);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(prisma.welcome.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(getStatusCode(res)).toBe(200);
      expect(getJsonResponse(res)).toEqual(mockWelcome);
    });

    it('should return 404 when no welcome data exists', async () => {
      prisma.welcome.findFirst.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(404);
      expect(getJsonResponse(res).message).toContain('Welcome data not found');
    });

    it('should handle database errors with 500', async () => {
      prisma.welcome.findFirst.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('HTTP method restrictions', () => {
    it('should return 405 for POST requests', async () => {
      const req = createMockRequest({ method: 'POST', body: validWelcomeData });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toContain('Method Not Allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toContain('Method Not Allowed');
    });

    it('should return 405 for DELETE requests', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it('should return 405 for PATCH requests', async () => {
      const req = createMockRequest({ method: 'PATCH' });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });
});
