/**
 * Tests for /api/revalidate.js
 *
 * Tests on-demand ISR revalidation API
 */

import revalidateHandler from '../../pages/api/revalidate.js';
import { getToken } from 'next-auth/jwt';
import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from '../setup/api-test-utils.js';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

describe('/api/revalidate', () => {
  let mockRevalidate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRevalidate = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  const createMockResponseWithRevalidate = () => {
    const res = createMockResponse();
    res.revalidate = mockRevalidate;
    return res;
  };

  describe('HTTP method restrictions', () => {
    beforeEach(() => {
      // Auth is now checked first via withAuth middleware
      getToken.mockResolvedValue({ email: 'admin@example.com' });
    });

    it('should return 405 for GET requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponseWithRevalidate();

      await revalidateHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponseWithRevalidate();

      await revalidateHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it('should return 405 for DELETE requests', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponseWithRevalidate();

      await revalidateHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      getToken.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'POST',
        body: { path: '/' },
      });
      const res = createMockResponseWithRevalidate();

      await revalidateHandler(req, res);

      expect(getStatusCode(res)).toBe(401);
      expect(getJsonResponse(res).message).toBe('Unauthorized');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return 400 when path is missing', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {},
      });
      const res = createMockResponseWithRevalidate();

      await revalidateHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('Path is required');
    });
  });

  describe('Revalidation', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should revalidate a single path', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { path: '/about' },
      });
      const res = createMockResponseWithRevalidate();

      await revalidateHandler(req, res);

      expect(mockRevalidate).toHaveBeenCalledWith('/about');
      const response = getJsonResponse(res);
      expect(response.revalidated).toBe(true);
      expect(response.paths).toContain('/about');
      expect(response.timestamp).toBeDefined();
    });

    it('should revalidate home page', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { path: '/' },
      });
      const res = createMockResponseWithRevalidate();

      await revalidateHandler(req, res);

      expect(mockRevalidate).toHaveBeenCalledWith('/');
      expect(getJsonResponse(res).revalidated).toBe(true);
    });

    it('should also revalidate articles index when revalidating specific article', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { path: '/articles/my-post' },
      });
      const res = createMockResponseWithRevalidate();

      await revalidateHandler(req, res);

      expect(mockRevalidate).toHaveBeenCalledWith('/articles/my-post');
      expect(mockRevalidate).toHaveBeenCalledWith('/articles');
      expect(mockRevalidate).toHaveBeenCalledWith('/');
      expect(getJsonResponse(res).paths).toContain('/articles/my-post');
      expect(getJsonResponse(res).paths).toContain('/articles');
      expect(getJsonResponse(res).paths).toContain('/');
    });

    it('should revalidate home page when revalidating articles', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { path: '/articles' },
      });
      const res = createMockResponseWithRevalidate();

      await revalidateHandler(req, res);

      expect(mockRevalidate).toHaveBeenCalledWith('/articles');
      expect(mockRevalidate).toHaveBeenCalledWith('/');
      expect(getJsonResponse(res).paths).toContain('/');
    });

    it('should continue if individual path revalidation fails', async () => {
      mockRevalidate
        .mockResolvedValueOnce(undefined) // First path succeeds
        .mockRejectedValueOnce(new Error('Not found')) // Second path fails
        .mockResolvedValueOnce(undefined); // Third path succeeds

      const req = createMockRequest({
        method: 'POST',
        body: { path: '/articles/test-post' },
      });
      const res = createMockResponseWithRevalidate();

      await revalidateHandler(req, res);

      expect(getJsonResponse(res).revalidated).toBe(true);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should return 500 when main revalidation fails', async () => {
      mockRevalidate.mockRejectedValue(new Error('Revalidation failed'));

      const req = createMockRequest({
        method: 'POST',
        body: { path: '/about' },
      });
      const res = createMockResponseWithRevalidate();

      await revalidateHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
      expect(getJsonResponse(res).message).toBe('Error revalidating');
      expect(getJsonResponse(res).error).toBe('Revalidation failed');
    });

    it('should include timestamp in response', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { path: '/' },
      });
      const res = createMockResponseWithRevalidate();

      await revalidateHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should handle path that exactly equals /articles (not a specific article)', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { path: '/articles' },
      });
      const res = createMockResponseWithRevalidate();

      await revalidateHandler(req, res);

      // Should not add /articles twice
      const paths = getJsonResponse(res).paths;
      const articlesPaths = paths.filter((p) => p === '/articles');
      expect(articlesPaths.length).toBe(1);
    });

    it('should handle paths with trailing slashes', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { path: '/about/' },
      });
      const res = createMockResponseWithRevalidate();

      await revalidateHandler(req, res);

      expect(mockRevalidate).toHaveBeenCalledWith('/about/');
    });
  });
});

