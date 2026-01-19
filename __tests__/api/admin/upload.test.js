/**
 * Tests for /api/admin/upload.js
 *
 * Tests admin file upload API route (POST)
 */

import uploadHandler from '../../../pages/api/admin/upload.js';
import { getToken } from 'next-auth/jwt';
import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from '../../setup/api-test-utils.js';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

describe('/api/admin/upload', () => {
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

      const req = createMockRequest({
        method: 'POST',
        body: { file: 'base64data', filename: 'test.jpg' },
      });
      const res = createMockResponse();

      await uploadHandler(req, res);

      expect(getStatusCode(res)).toBe(401);
      expect(getJsonResponse(res).message).toBe('Unauthorized');
    });
  });

  describe('HTTP method restrictions', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return 405 for GET requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await uploadHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await uploadHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });

  describe('POST requests - file upload', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should upload a valid image file', async () => {
      const base64Data = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

      const req = createMockRequest({
        method: 'POST',
        body: {
          file: base64Data,
          filename: 'test.jpg',
          type: 'image/jpeg',
        },
      });
      const res = createMockResponse();

      await uploadHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.url).toMatch(/^\/uploads\/test-\d+\.jpg$/);
      expect(response.filename).toMatch(/^test-\d+\.jpg$/);
    });

    it('should return 400 when file is missing', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { filename: 'test.jpg' },
      });
      const res = createMockResponse();

      await uploadHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('File and filename are required');
    });

    it('should return 400 when filename is missing', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { file: 'base64data' },
      });
      const res = createMockResponse();

      await uploadHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('File and filename are required');
    });

    it('should return 400 for invalid file type', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          file: 'base64data',
          filename: 'malware.exe',
          type: 'application/x-msdownload',
        },
      });
      const res = createMockResponse();

      await uploadHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('Invalid file type');
    });

    it('should accept image/jpeg', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          file: 'data:image/jpeg;base64,abc123',
          filename: 'photo.jpg',
          type: 'image/jpeg',
        },
      });
      const res = createMockResponse();

      await uploadHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
    });

    it('should accept image/png', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          file: 'data:image/png;base64,abc123',
          filename: 'photo.png',
          type: 'image/png',
        },
      });
      const res = createMockResponse();

      await uploadHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
    });

    it('should accept image/gif', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          file: 'data:image/gif;base64,abc123',
          filename: 'animation.gif',
          type: 'image/gif',
        },
      });
      const res = createMockResponse();

      await uploadHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
    });

    it('should accept image/webp', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          file: 'data:image/webp;base64,abc123',
          filename: 'photo.webp',
          type: 'image/webp',
        },
      });
      const res = createMockResponse();

      await uploadHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
    });

    it('should accept video/mp4', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          file: 'data:video/mp4;base64,abc123',
          filename: 'video.mp4',
          type: 'video/mp4',
        },
      });
      const res = createMockResponse();

      await uploadHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
    });

    it('should accept video/webm', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          file: 'data:video/webm;base64,abc123',
          filename: 'video.webm',
          type: 'video/webm',
        },
      });
      const res = createMockResponse();

      await uploadHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
    });

    it('should generate unique filename', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          file: 'data:image/jpeg;base64,abc123',
          filename: 'photo.jpg',
          type: 'image/jpeg',
        },
      });
      const res = createMockResponse();

      await uploadHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.filename).toMatch(/^photo-\d+\.jpg$/);
    });

    it('should preserve file extension', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          file: 'data:image/png;base64,abc123',
          filename: 'image.png',
          type: 'image/png',
        },
      });
      const res = createMockResponse();

      await uploadHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.filename).toMatch(/\.png$/);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should handle missing file and filename together', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {},
      });
      const res = createMockResponse();

      await uploadHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('File and filename are required');
    });
  });
});

