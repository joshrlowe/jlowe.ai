/**
 * Tests for /api/admin/projects/bulk.js
 *
 * Tests admin bulk operations API route (POST)
 */

import bulkHandler from '../../../pages/api/admin/projects/bulk.js';
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
    project: {
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
  },
}));

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock activity logger
jest.mock('../../../lib/utils/activityLogger.js', () => ({
  logActivity: jest.fn().mockResolvedValue({}),
}));

describe('/api/admin/projects/bulk', () => {
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
        body: { action: 'delete', projectIds: ['1', '2'] },
      });
      const res = createMockResponse();

      await bulkHandler(req, res);

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

      await bulkHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await bulkHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });

  describe('POST requests - delete action', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should delete multiple projects', async () => {
      prisma.project.deleteMany.mockResolvedValue({ count: 3 });

      const req = createMockRequest({
        method: 'POST',
        body: {
          action: 'delete',
          projectIds: ['1', '2', '3'],
        },
      });
      const res = createMockResponse();

      await bulkHandler(req, res);

      expect(prisma.project.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['1', '2', '3'] } },
      });
      expect(getJsonResponse(res).message).toBe('3 project(s) deleted successfully');
    });

    it('should return 400 when no projectIds provided', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { action: 'delete', projectIds: [] },
      });
      const res = createMockResponse();

      await bulkHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('No projects selected');
    });

    it('should return 400 when projectIds is not an array', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { action: 'delete', projectIds: 'not-an-array' },
      });
      const res = createMockResponse();

      await bulkHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('No projects selected');
    });
  });

  describe('POST requests - updateStatus action', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should update status of multiple projects', async () => {
      prisma.project.updateMany.mockResolvedValue({ count: 2 });

      const req = createMockRequest({
        method: 'POST',
        body: {
          action: 'updateStatus',
          projectIds: ['1', '2'],
          data: { status: 'Completed' },
        },
      });
      const res = createMockResponse();

      await bulkHandler(req, res);

      expect(prisma.project.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['1', '2'] } },
        data: { status: 'Completed' },
      });
      expect(getJsonResponse(res).message).toBe('2 project(s) updated successfully');
    });

    it('should return 400 when status is not provided', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          action: 'updateStatus',
          projectIds: ['1', '2'],
          data: {},
        },
      });
      const res = createMockResponse();

      await bulkHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('Status is required');
    });
  });

  describe('POST requests - updateFeatured action', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should update featured flag of multiple projects', async () => {
      prisma.project.updateMany.mockResolvedValue({ count: 2 });

      const req = createMockRequest({
        method: 'POST',
        body: {
          action: 'updateFeatured',
          projectIds: ['1', '2'],
          data: { featured: true },
        },
      });
      const res = createMockResponse();

      await bulkHandler(req, res);

      expect(prisma.project.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['1', '2'] } },
        data: { featured: true },
      });
      expect(getJsonResponse(res).message).toBe('2 project(s) updated successfully');
    });

    it('should return 400 when featured value is not provided', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          action: 'updateFeatured',
          projectIds: ['1', '2'],
          data: {},
        },
      });
      const res = createMockResponse();

      await bulkHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('Featured value is required');
    });
  });

  describe('POST requests - invalid action', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return 400 for invalid action', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          action: 'invalidAction',
          projectIds: ['1', '2'],
        },
      });
      const res = createMockResponse();

      await bulkHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('Invalid action');
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should handle database errors', async () => {
      prisma.project.deleteMany.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'POST',
        body: {
          action: 'delete',
          projectIds: ['1', '2'],
        },
      });
      const res = createMockResponse();

      await bulkHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });
});

