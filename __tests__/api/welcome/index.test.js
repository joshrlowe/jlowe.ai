/**
 * Tests for /api/welcome/index.js
 *
 * Tests welcome data API route
 */

import welcomeHandler from '../../../pages/api/welcome/index.js';
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
    welcome: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
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

  describe('POST requests', () => {
    it('should create welcome data with valid input', async () => {
      const mockCreatedWelcome = {
        id: '1',
        ...validWelcomeData,
        createdAt: new Date(),
      };

      prisma.welcome.deleteMany.mockResolvedValue({ count: 0 });
      prisma.welcome.create.mockResolvedValue(mockCreatedWelcome);

      const req = createMockRequest({
        method: 'POST',
        body: validWelcomeData,
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(prisma.welcome.deleteMany).toHaveBeenCalled();
      expect(prisma.welcome.create).toHaveBeenCalledWith({
        data: {
          name: validWelcomeData.name,
          briefBio: validWelcomeData.briefBio,
          callToAction: validWelcomeData.callToAction,
        },
      });
      expect(getStatusCode(res)).toBe(201);
      expect(getJsonResponse(res)).toEqual(mockCreatedWelcome);
    });

    it('should return 400 when name is missing', async () => {
      const invalidData = { ...validWelcomeData };
      delete invalidData.name;

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('name');
    });

    it('should return 400 when briefBio is missing', async () => {
      const invalidData = { ...validWelcomeData };
      delete invalidData.briefBio;

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('briefBio');
    });

    it('should return 400 when callToAction is missing', async () => {
      const invalidData = { ...validWelcomeData };
      delete invalidData.callToAction;

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('callToAction');
    });

    it('should handle null callToAction', async () => {
      const dataWithNullCTA = {
        name: 'Josh Lowe',
        briefBio: 'AI/ML Engineer',
        callToAction: null,
      };

      const req = createMockRequest({
        method: 'POST',
        body: dataWithNullCTA,
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });

    it('should handle missing callToAction field', async () => {
      const dataWithoutCTA = {
        name: 'Josh Lowe',
        briefBio: 'AI/ML Engineer',
      };

      const req = createMockRequest({
        method: 'POST',
        body: dataWithoutCTA,
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });

    it('should store callToAction when provided', async () => {
      prisma.welcome.deleteMany.mockResolvedValue({ count: 0 });
      prisma.welcome.create.mockResolvedValue({
        id: '1',
        ...validWelcomeData,
      });

      const req = createMockRequest({
        method: 'POST',
        body: validWelcomeData,
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(prisma.welcome.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          callToAction: validWelcomeData.callToAction,
        }),
      });
    });

    it('should delete existing welcome before creating new one', async () => {
      prisma.welcome.deleteMany.mockResolvedValue({ count: 1 });
      prisma.welcome.create.mockResolvedValue({
        id: '2',
        ...validWelcomeData,
      });

      const req = createMockRequest({
        method: 'POST',
        body: validWelcomeData,
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(prisma.welcome.deleteMany).toHaveBeenCalledTimes(1);
      expect(prisma.welcome.create).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors with 500', async () => {
      prisma.welcome.deleteMany.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'POST',
        body: validWelcomeData,
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('HTTP method restrictions', () => {
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

  describe('Edge cases', () => {
    it('should handle empty request body', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {},
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });

    it('should handle null values', async () => {
      const invalidData = {
        name: null,
        briefBio: null,
        callToAction: null,
      };

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });

    it('should handle very long strings', async () => {
      const longString = 'a'.repeat(10000);
      const dataWithLongStrings = {
        ...validWelcomeData,
        briefBio: longString,
      };

      prisma.welcome.deleteMany.mockResolvedValue({ count: 0 });
      prisma.welcome.create.mockResolvedValue({
        id: '1',
        ...dataWithLongStrings,
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithLongStrings,
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should handle special characters', async () => {
      const dataWithSpecialChars = {
        ...validWelcomeData,
        name: "O'Brien & Co. <script>alert('xss')</script>",
      };

      prisma.welcome.deleteMany.mockResolvedValue({ count: 0 });
      prisma.welcome.create.mockResolvedValue({
        id: '1',
        ...dataWithSpecialChars,
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithSpecialChars,
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should handle unicode characters', async () => {
      const dataWithUnicode = {
        ...validWelcomeData,
        name: '安倍晋三 👨‍💻',
        briefBio: 'Building 🚀 AI systems',
      };

      prisma.welcome.deleteMany.mockResolvedValue({ count: 0 });
      prisma.welcome.create.mockResolvedValue({
        id: '1',
        ...dataWithUnicode,
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithUnicode,
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should handle empty strings', async () => {
      const dataWithEmptyStrings = {
        name: '',
        briefBio: '',
        callToAction: '',
      };

      const req = createMockRequest({
        method: 'POST',
        body: dataWithEmptyStrings,
      });
      const res = createMockResponse();

      await welcomeHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });
  });
});

