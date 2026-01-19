/**
 * Tests for /api/admin/posts/index.js
 *
 * Tests admin posts API route (GET/POST)
 */

import postsHandler from '../../../pages/api/admin/posts/index.js';
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
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock readingTime utility
jest.mock('../../../lib/utils/readingTime.js', () => ({
  calculateReadingTime: jest.fn(() => '5 min read'),
}));

describe('/api/admin/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      getToken.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(getStatusCode(res)).toBe(401);
      expect(getJsonResponse(res).message).toBe('Unauthorized');
    });
  });

  describe('GET requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return posts with default pagination', async () => {
      const mockPosts = [
        { id: '1', title: 'Post 1', status: 'Published', _count: { comments: 5, likes: 10 } },
        { id: '2', title: 'Post 2', status: 'Draft', _count: { comments: 0, likes: 0 } },
      ];
      prisma.post.findMany.mockResolvedValue(mockPosts);
      prisma.post.count.mockResolvedValue(2);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await postsHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.posts).toEqual(mockPosts);
      expect(response.total).toBe(2);
    });

    it('should filter by status', async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);

      const req = createMockRequest({
        method: 'GET',
        query: { status: 'Published' },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'Published' }),
        })
      );
    });

    it('should not filter status when "all" is specified', async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);

      const req = createMockRequest({
        method: 'GET',
        query: { status: 'all' },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ status: expect.anything() }),
        })
      );
    });

    it('should filter by topic', async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);

      const req = createMockRequest({
        method: 'GET',
        query: { topic: 'React' },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ topic: 'react' }),
        })
      );
    });

    it('should search by title and description', async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);

      const req = createMockRequest({
        method: 'GET',
        query: { search: 'test query' },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'test query', mode: 'insensitive' } },
              { description: { contains: 'test query', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should include comment and like counts', async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            _count: {
              select: {
                comments: true,
                likes: true,
              },
            },
          },
        })
      );
    });

    it('should handle database errors', async () => {
      prisma.post.findMany.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('POST requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should create a new post', async () => {
      const newPost = {
        id: '1',
        title: 'New Post',
        description: 'Description',
        postType: 'Article',
        topic: 'react',
        slug: 'new-post',
        author: 'Josh Lowe',
        status: 'Draft',
      };
      prisma.post.create.mockResolvedValue(newPost);

      const req = createMockRequest({
        method: 'POST',
        body: {
          title: 'New Post',
          description: 'Description',
          postType: 'Article',
          topic: 'React',
          slug: 'new-post',
          author: 'Josh Lowe',
        },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
      expect(getJsonResponse(res)).toEqual(newPost);
    });

    it('should return 400 when missing required fields', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          title: 'New Post',
          // Missing required fields
        },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('Missing required fields');
    });

    it('should lowercase the topic', async () => {
      prisma.post.create.mockResolvedValue({ id: '1' });

      const req = createMockRequest({
        method: 'POST',
        body: {
          title: 'New Post',
          description: 'Description',
          postType: 'Article',
          topic: 'JavaScript',
          slug: 'new-post',
          author: 'Josh Lowe',
        },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          topic: 'javascript',
        }),
      });
    });

    it('should set datePublished when status is Published', async () => {
      prisma.post.create.mockResolvedValue({ id: '1' });

      const req = createMockRequest({
        method: 'POST',
        body: {
          title: 'New Post',
          description: 'Description',
          postType: 'Article',
          topic: 'react',
          slug: 'new-post',
          author: 'Josh Lowe',
          status: 'Published',
        },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          datePublished: expect.any(Date),
        }),
      });
    });

    it('should handle database errors on create', async () => {
      prisma.post.create.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'POST',
        body: {
          title: 'New Post',
          description: 'Description',
          postType: 'Article',
          topic: 'react',
          slug: 'new-post',
          author: 'Josh Lowe',
        },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('HTTP method restrictions', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for DELETE requests', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });
});

