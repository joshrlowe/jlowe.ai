/**
 * Tests for /api/contact/index.js
 *
 * Tests contact information API route
 */

import contactHandler from '../../../pages/api/contact/index.js';
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
    contact: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('/api/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validContactData = {
    name: 'Josh Lowe',
    emailAddress: 'josh@jlowe.ai',
    phoneNumber: '+1 (555) 123-4567',
    socialMediaLinks: {
      linkedIn: 'https://linkedin.com/in/joshlowe',
      github: 'https://github.com/joshlowe',
    },
  };

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

  describe('POST requests', () => {
    it('should create contact data with valid input', async () => {
      const mockCreatedContact = {
        id: '1',
        ...validContactData,
        createdAt: new Date(),
      };

      prisma.contact.deleteMany.mockResolvedValue({ count: 0 });
      prisma.contact.create.mockResolvedValue(mockCreatedContact);

      const req = createMockRequest({
        method: 'POST',
        body: validContactData,
      });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(prisma.contact.deleteMany).toHaveBeenCalled();
      expect(prisma.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: validContactData.name,
          emailAddress: validContactData.emailAddress,
          phoneNumber: validContactData.phoneNumber,
          socialMediaLinks: validContactData.socialMediaLinks,
        }),
      });
      expect(getStatusCode(res)).toBe(201);
      expect(getJsonResponse(res)).toEqual(mockCreatedContact);
    });

    it('should return 400 when name is missing', async () => {
      const invalidData = { ...validContactData };
      delete invalidData.name;

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('name');
    });

    it('should return 400 when emailAddress is missing', async () => {
      const invalidData = { ...validContactData };
      delete invalidData.emailAddress;

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('emailAddress');
    });

    it('should handle optional phoneNumber when explicitly null', async () => {
      const dataWithNullPhone = {
        ...validContactData,
        phoneNumber: null,
      };

      prisma.contact.deleteMany.mockResolvedValue({ count: 0 });
      prisma.contact.create.mockResolvedValue({
        id: '1',
        ...dataWithNullPhone,
        phoneNumber: null,
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithNullPhone,
      });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(prisma.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phoneNumber: null,
        }),
      });
      expect(getStatusCode(res)).toBe(201);
    });

    it('should handle optional socialMediaLinks', async () => {
      const dataWithoutSocial = { ...validContactData };
      delete dataWithoutSocial.socialMediaLinks;

      prisma.contact.deleteMany.mockResolvedValue({ count: 0 });
      prisma.contact.create.mockResolvedValue({
        id: '1',
        ...dataWithoutSocial,
        socialMediaLinks: null,
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithoutSocial,
      });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(prisma.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          socialMediaLinks: null,
        }),
      });
      expect(getStatusCode(res)).toBe(201);
    });

    it('should delete existing contact before creating new one', async () => {
      prisma.contact.deleteMany.mockResolvedValue({ count: 1 });
      prisma.contact.create.mockResolvedValue({
        id: '2',
        ...validContactData,
      });

      const req = createMockRequest({
        method: 'POST',
        body: validContactData,
      });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(prisma.contact.deleteMany).toHaveBeenCalledTimes(1);
      expect(prisma.contact.create).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors with 500', async () => {
      prisma.contact.deleteMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      const req = createMockRequest({
        method: 'POST',
        body: validContactData,
      });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
      expect(getJsonResponse(res).message).toBeDefined();
    });

    it('should handle empty request body', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {},
      });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });

    it('should handle null values in body', async () => {
      const invalidData = {
        name: null,
        emailAddress: null,
      };

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });
  });

  describe('HTTP method restrictions', () => {
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

  describe('Edge cases', () => {
    it('should handle very long strings', async () => {
      const longString = 'a'.repeat(10000);
      const dataWithLongStrings = {
        ...validContactData,
        name: longString,
      };

      prisma.contact.deleteMany.mockResolvedValue({ count: 0 });
      prisma.contact.create.mockResolvedValue({
        id: '1',
        ...dataWithLongStrings,
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithLongStrings,
      });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should handle special characters in strings', async () => {
      const dataWithSpecialChars = {
        ...validContactData,
        name: "O'Brien & Co. <script>alert('xss')</script>",
      };

      prisma.contact.deleteMany.mockResolvedValue({ count: 0 });
      prisma.contact.create.mockResolvedValue({
        id: '1',
        ...dataWithSpecialChars,
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithSpecialChars,
      });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should handle nested objects in socialMediaLinks', async () => {
      const dataWithNestedObjects = {
        ...validContactData,
        socialMediaLinks: {
          linkedIn: 'https://linkedin.com',
          github: 'https://github.com',
          custom: {
            platform: 'Discord',
            url: 'https://discord.com',
          },
        },
      };

      prisma.contact.deleteMany.mockResolvedValue({ count: 0 });
      prisma.contact.create.mockResolvedValue({
        id: '1',
        ...dataWithNestedObjects,
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithNestedObjects,
      });
      const res = createMockResponse();

      await contactHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });
  });
});

