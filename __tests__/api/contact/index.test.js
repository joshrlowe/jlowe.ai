/**
 * Tests for /api/contact/index
 *
 * Tests contact information API route
 */

import contactHandler from '../../../pages/api/contact/index';
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
    contact: {
      findFirst: jest.fn(),
    },
  },
}));

describe('/api/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should return latest contact data with 200', async () => {
      const mockContact = {
        id: '1',
        name: 'Josh Lowe',
        emailAddress: 'josh@jlowe.ai',
        phoneNumber: '+1 (555) 123-4567',
        socialMediaLinks: {
          linkedIn: 'https://linkedin.com/in/joshlowe',
          github: 'https://github.com/joshlowe',
        },
        heroWords: ['Amazing', 'Innovative', 'Momentous'],
        heroSubtitle: null,
        createdAt: new Date(),
      };

      prisma.contact.findFirst.mockResolvedValue(mockContact);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(prisma.contact.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(getStatusCode(res)).toBe(200);
      expect(getJsonResponse(res)).toEqual(mockContact);
    });

    it('should return 404 when no contact data exists', async () => {
      prisma.contact.findFirst.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(getStatusCode(res)).toBe(404);
      expect(getJsonResponse(res).message).toContain('Contact data not found');
    });

    it('should handle database errors with 500', async () => {
      prisma.contact.findFirst.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
      expect(getJsonResponse(res).message).toBeDefined();
    });
  });

  describe('HTTP method restrictions', () => {
    it('should return 405 for POST requests', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { name: 'Josh Lowe', emailAddress: 'josh@jlowe.ai' },
      });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toContain('Method Not Allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toContain('Method Not Allowed');
    });

    it('should return 405 for DELETE requests', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toContain('Method Not Allowed');
    });

    it('should return 405 for PATCH requests', async () => {
      const req = createMockRequest({ method: 'PATCH' });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });
});
