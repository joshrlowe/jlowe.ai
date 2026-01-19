/**
 * Tests for /api/admin/posts/[id].js
 *
 * Tests admin posts CRUD by ID API route
 */

import postsIdHandler from '../../../pages/api/admin/posts/[id].js';
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
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock readingTime utility
jest.mock('../../../lib/utils/readingTime.js', () => ({
  calculateReadingTime: jest.fn(() => 5),
}));

describe('/api/admin/posts/[id]', () => {
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

      const req = createMockRequest({ method: 'GET', query: { id: 'post-1' } });
      const res = createMockResponse();

      await postsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(401);
      expect(getJsonResponse(res).message).toBe('Unauthorized');
    });
  });

  describe('GET requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return post by ID with comment and like counts', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        status: 'published',
        _count: {
          comments: 5,
          likes: 10,
        },
      };
      prisma.post.findUnique.mockResolvedValue(mockPost);

      const req = createMockRequest({ method: 'GET', query: { id: 'post-1' } });
      const res = createMockResponse();

      await postsIdHandler(req, res);

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        include: {
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      });
      expect(getJsonResponse(res)).toEqual(mockPost);
    });

    it('should return 404 when post not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET', query: { id: 'non-existent' } });
      const res = createMockResponse();

      await postsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(404);
      expect(getJsonResponse(res).message).toBe('Post not found');
    });

    it('should handle database errors', async () => {
      prisma.post.findUnique.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({ method: 'GET', query: { id: 'post-1' } });
      const res = createMockResponse();

      await postsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('PUT requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should update post with provided data', async () => {
      const updatedPost = {
        id: 'post-1',
        title: 'Updated Title',
        content: 'Updated content',
        readingTime: 5,
      };
      prisma.post.update.mockResolvedValue(updatedPost);

      const req = createMockRequest({
        method: 'PUT',
        query: { id: 'post-1' },
        body: { title: 'Updated Title', content: 'Updated content' },
      });
      const res = createMockResponse();

      await postsIdHandler(req, res);

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: expect.objectContaining({
          title: 'Updated Title',
          content: 'Updated content',
          readingTime: 5,
        }),
      });
      expect(getJsonResponse(res)).toEqual(updatedPost);
    });

    it('should calculate reading time when content is updated', async () => {
      const { calculateReadingTime } = require('../../../lib/utils/readingTime.js');
      calculateReadingTime.mockReturnValue(8);

      prisma.post.update.mockResolvedValue({ id: 'post-1', readingTime: 8 });

      const req = createMockRequest({
        method: 'PUT',
        query: { id: 'post-1' },
        body: { content: 'New long content here...' },
      });
      const res = createMockResponse();

      await postsIdHandler(req, res);

      expect(calculateReadingTime).toHaveBeenCalledWith('New long content here...');
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: expect.objectContaining({
          readingTime: 8,
        }),
      });
    });

    it('should convert datePublished to Date object', async () => {
      prisma.post.update.mockResolvedValue({ id: 'post-1' });

      const req = createMockRequest({
        method: 'PUT',
        query: { id: 'post-1' },
        body: { datePublished: '2024-01-15T10:00:00Z' },
      });
      const res = createMockResponse();

      await postsIdHandler(req, res);

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: expect.objectContaining({
          datePublished: new Date('2024-01-15T10:00:00Z'),
        }),
      });
    });

    it('should convert topic to lowercase', async () => {
      prisma.post.update.mockResolvedValue({ id: 'post-1' });

      const req = createMockRequest({
        method: 'PUT',
        query: { id: 'post-1' },
        body: { topic: 'TECHNOLOGY' },
      });
      const res = createMockResponse();

      await postsIdHandler(req, res);

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: expect.objectContaining({
          topic: 'technology',
        }),
      });
    });

    it('should handle database errors', async () => {
      prisma.post.update.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'PUT',
        query: { id: 'post-1' },
        body: { title: 'Test' },
      });
      const res = createMockResponse();

      await postsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('DELETE requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should delete post and return 204', async () => {
      prisma.post.delete.mockResolvedValue({ id: 'post-1' });

      const req = createMockRequest({
        method: 'DELETE',
        query: { id: 'post-1' },
      });
      const res = createMockResponse();

      await postsIdHandler(req, res);

      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      });
      expect(getStatusCode(res)).toBe(204);
    });

    it('should handle not found error', async () => {
      const notFoundError = new Error('Record not found');
      notFoundError.code = 'P2025';
      prisma.post.delete.mockRejectedValue(notFoundError);

      const req = createMockRequest({
        method: 'DELETE',
        query: { id: 'non-existent' },
      });
      const res = createMockResponse();

      await postsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(404);
    });

    it('should handle database errors', async () => {
      prisma.post.delete.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'DELETE',
        query: { id: 'post-1' },
      });
      const res = createMockResponse();

      await postsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('HTTP method restrictions', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return 405 for POST requests', async () => {
      const req = createMockRequest({
        method: 'POST',
        query: { id: 'post-1' },
      });
      const res = createMockResponse();

      await postsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for PATCH requests', async () => {
      const req = createMockRequest({
        method: 'PATCH',
        query: { id: 'post-1' },
      });
      const res = createMockResponse();

      await postsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });
});

