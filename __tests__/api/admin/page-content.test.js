/**
 * Tests for /api/admin/page-content.js
 *
 * Tests admin page content API route (GET/PUT)
 */

import pageContentHandler from '../../../pages/api/admin/page-content.js';
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
    pageContent: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

describe('/api/admin/page-content', () => {
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

      const req = createMockRequest({ method: 'GET', query: { pageKey: 'home' } });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      expect(getStatusCode(res)).toBe(401);
      expect(getJsonResponse(res).message).toBe('Unauthorized');
    });
  });

  describe('GET requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return page content when found', async () => {
      const mockContent = {
        pageKey: 'home',
        content: { heroTitle: 'Test Title' },
      };
      prisma.pageContent.findUnique.mockResolvedValue(mockContent);

      const req = createMockRequest({
        method: 'GET',
        query: { pageKey: 'home' },
      });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      expect(prisma.pageContent.findUnique).toHaveBeenCalledWith({
        where: { pageKey: 'home' },
      });
      expect(getJsonResponse(res)).toEqual(mockContent);
    });

    it('should return default home content when not found', async () => {
      prisma.pageContent.findUnique.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'GET',
        query: { pageKey: 'home' },
      });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.pageKey).toBe('home');
      expect(response.content).toBeDefined();
      expect(response.content.typingIntro).toBe('I build...');
      expect(response.content.heroTitle).toBe('intelligent AI systems');
    });

    it('should return default about content when not found', async () => {
      prisma.pageContent.findUnique.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'GET',
        query: { pageKey: 'about' },
      });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.pageKey).toBe('about');
      expect(response.content.bio).toEqual([]);
      expect(response.content.skills).toEqual([]);
    });

    it('should return default contact content when not found', async () => {
      prisma.pageContent.findUnique.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'GET',
        query: { pageKey: 'contact' },
      });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.pageKey).toBe('contact');
      expect(response.content.headline).toBe('');
    });

    it('should return empty object for unknown page key', async () => {
      prisma.pageContent.findUnique.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'GET',
        query: { pageKey: 'unknown' },
      });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.content).toEqual({});
    });

    it('should return 400 when pageKey is missing', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {},
      });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('pageKey is required');
    });

    it('should handle database errors', async () => {
      prisma.pageContent.findUnique.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'GET',
        query: { pageKey: 'home' },
      });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('PUT requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should upsert page content successfully', async () => {
      const upsertedContent = {
        pageKey: 'home',
        content: { heroTitle: 'New Title' },
      };
      prisma.pageContent.upsert.mockResolvedValue(upsertedContent);

      const req = createMockRequest({
        method: 'PUT',
        body: {
          pageKey: 'home',
          content: { heroTitle: 'New Title' },
        },
      });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      expect(prisma.pageContent.upsert).toHaveBeenCalledWith({
        where: { pageKey: 'home' },
        update: { content: { heroTitle: 'New Title' } },
        create: { pageKey: 'home', content: { heroTitle: 'New Title' } },
      });
      expect(getJsonResponse(res)).toEqual(upsertedContent);
    });

    it('should return 400 when pageKey is missing', async () => {
      const req = createMockRequest({
        method: 'PUT',
        body: { content: {} },
      });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('pageKey and content are required');
    });

    it('should return 400 when content is missing', async () => {
      const req = createMockRequest({
        method: 'PUT',
        body: { pageKey: 'home' },
      });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('pageKey and content are required');
    });

    it('should handle database errors', async () => {
      prisma.pageContent.upsert.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'PUT',
        body: { pageKey: 'home', content: {} },
      });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('HTTP method restrictions', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return 405 for POST requests', async () => {
      const req = createMockRequest({ method: 'POST' });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for DELETE requests', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it('should return 405 for PATCH requests', async () => {
      const req = createMockRequest({ method: 'PATCH' });
      const res = createMockResponse();

      await pageContentHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });
});

