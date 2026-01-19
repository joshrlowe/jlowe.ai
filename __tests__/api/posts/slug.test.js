/**
 * Tests for /api/posts/[topic]/[slug].js
 *
 * Tests public post API route (GET/PUT/DELETE)
 */

import postHandler from '../../../pages/api/posts/[topic]/[slug].js';
import prisma from '../../../lib/prisma.js';
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

// Mock readingTime utility
jest.mock('../../../lib/utils/readingTime.js', () => ({
  calculateReadingTime: jest.fn(() => '5 min read'),
}));

describe('/api/posts/[topic]/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('GET requests', () => {
    it('should return a post by topic and slug', async () => {
      const mockPost = {
        id: '1',
        title: 'Test Post',
        content: '# Test content',
        topic: 'react',
        slug: 'test-post',
        viewCount: 10,
        status: 'Published',
        _count: { comments: 5, likes: 10 },
      };
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.post.update.mockResolvedValue({ ...mockPost, viewCount: 11 });

      const req = createMockRequest({
        method: 'GET',
        query: { topic: 'react', slug: 'test-post' },
      });
      const res = createMockResponse();

      await postHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.title).toBe('Test Post');
      expect(response.viewCount).toBe(11); // Incremented
    });

    it('should lowercase the topic when querying', async () => {
      prisma.post.findUnique.mockResolvedValue({
        id: '1',
        title: 'Test',
        viewCount: 0,
        _count: { comments: 0, likes: 0 },
      });
      prisma.post.update.mockResolvedValue({ id: '1', viewCount: 1 });

      const req = createMockRequest({
        method: 'GET',
        query: { topic: 'REACT', slug: 'test-post' },
      });
      const res = createMockResponse();

      await postHandler(req, res);

      expect(prisma.post.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            topic: 'react',
          }),
        })
      );
    });

    it('should return 404 when post not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'GET',
        query: { topic: 'react', slug: 'nonexistent' },
      });
      const res = createMockResponse();

      await postHandler(req, res);

      expect(getStatusCode(res)).toBe(404);
      expect(getJsonResponse(res).message).toBe('Post not found');
    });

    it('should increment view count', async () => {
      const mockPost = {
        id: '1',
        title: 'Test',
        viewCount: 100,
        _count: { comments: 0, likes: 0 },
      };
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.post.update.mockResolvedValue({ ...mockPost, viewCount: 101 });

      const req = createMockRequest({
        method: 'GET',
        query: { topic: 'react', slug: 'test' },
      });
      const res = createMockResponse();

      await postHandler(req, res);

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { viewCount: { increment: 1 } },
      });
    });

    it('should include approved comment count', async () => {
      prisma.post.findUnique.mockResolvedValue({
        id: '1',
        title: 'Test',
        viewCount: 0,
        _count: { comments: 3, likes: 5 },
      });
      prisma.post.update.mockResolvedValue({ id: '1', viewCount: 1 });

      const req = createMockRequest({
        method: 'GET',
        query: { topic: 'react', slug: 'test' },
      });
      const res = createMockResponse();

      await postHandler(req, res);

      expect(prisma.post.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            _count: expect.objectContaining({
              select: expect.objectContaining({
                comments: { where: { approved: true } },
                likes: true,
              }),
            }),
          }),
        })
      );
    });

    it('should handle database errors', async () => {
      prisma.post.findUnique.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'GET',
        query: { topic: 'react', slug: 'test' },
      });
      const res = createMockResponse();

      await postHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('PUT requests', () => {
    it('should update a post', async () => {
      const updatedPost = {
        id: '1',
        title: 'Updated Title',
        content: 'Updated content',
        topic: 'react',
        slug: 'test-post',
      };
      prisma.post.update.mockResolvedValue(updatedPost);

      const req = createMockRequest({
        method: 'PUT',
        query: { topic: 'react', slug: 'test-post' },
        body: { title: 'Updated Title', content: 'Updated content' },
      });
      const res = createMockResponse();

      await postHandler(req, res);

      expect(getJsonResponse(res)).toEqual(updatedPost);
    });

    it('should calculate reading time when content is updated', async () => {
      prisma.post.update.mockResolvedValue({ id: '1' });

      const req = createMockRequest({
        method: 'PUT',
        query: { topic: 'react', slug: 'test-post' },
        body: { content: 'New long content here...' },
      });
      const res = createMockResponse();

      await postHandler(req, res);

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: expect.anything(),
        data: expect.objectContaining({
          readingTime: '5 min read',
        }),
      });
    });

    it('should convert datePublished to Date object', async () => {
      prisma.post.update.mockResolvedValue({ id: '1' });

      const req = createMockRequest({
        method: 'PUT',
        query: { topic: 'react', slug: 'test-post' },
        body: { datePublished: '2024-06-15' },
      });
      const res = createMockResponse();

      await postHandler(req, res);

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: expect.anything(),
        data: expect.objectContaining({
          datePublished: expect.any(Date),
        }),
      });
    });

    it('should handle update errors', async () => {
      prisma.post.update.mockRejectedValue(new Error('Update failed'));

      const req = createMockRequest({
        method: 'PUT',
        query: { topic: 'react', slug: 'test-post' },
        body: { title: 'Updated' },
      });
      const res = createMockResponse();

      await postHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('DELETE requests', () => {
    it('should delete a post', async () => {
      prisma.post.delete.mockResolvedValue({ id: '1' });

      const req = createMockRequest({
        method: 'DELETE',
        query: { topic: 'react', slug: 'test-post' },
      });
      const res = {
        ...createMockResponse(),
        end: jest.fn(),
      };

      await postHandler(req, res);

      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: {
          slug: 'test-post',
          topic: 'react',
        },
      });
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      prisma.post.delete.mockRejectedValue(new Error('Delete failed'));

      const req = createMockRequest({
        method: 'DELETE',
        query: { topic: 'react', slug: 'test-post' },
      });
      const res = {
        ...createMockResponse(),
        end: jest.fn(),
      };

      await postHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('HTTP method restrictions', () => {
    it('should return 405 for POST requests', async () => {
      const req = createMockRequest({
        method: 'POST',
        query: { topic: 'react', slug: 'test' },
      });
      const res = createMockResponse();

      await postHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for PATCH requests', async () => {
      const req = createMockRequest({
        method: 'PATCH',
        query: { topic: 'react', slug: 'test' },
      });
      const res = createMockResponse();

      await postHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });
});

