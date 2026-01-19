/**
 * Tests for /api/admin/activity-log.js
 *
 * Tests admin activity log API route (GET)
 */

import activityLogHandler from '../../../pages/api/admin/activity-log.js';
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
    activityLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

describe('/api/admin/activity-log', () => {
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

      await activityLogHandler(req, res);

      expect(getStatusCode(res)).toBe(401);
      expect(getJsonResponse(res).message).toBe('Unauthorized');
    });

    it('should proceed when authenticated', async () => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
      prisma.activityLog.findMany.mockResolvedValue([]);
      prisma.activityLog.count.mockResolvedValue(0);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await activityLogHandler(req, res);

      expect(getStatusCode(res)).not.toBe(401);
    });
  });

  describe('GET requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return activity logs with default pagination', async () => {
      const mockLogs = [
        { id: '1', entityType: 'Project', action: 'create', createdAt: new Date() },
        { id: '2', entityType: 'Project', action: 'update', createdAt: new Date() },
      ];
      prisma.activityLog.findMany.mockResolvedValue(mockLogs);
      prisma.activityLog.count.mockResolvedValue(2);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await activityLogHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.logs).toEqual(mockLogs);
      expect(response.total).toBe(2);
      expect(response.limit).toBe(50);
      expect(response.offset).toBe(0);
    });

    it('should filter by entityType', async () => {
      prisma.activityLog.findMany.mockResolvedValue([]);
      prisma.activityLog.count.mockResolvedValue(0);

      const req = createMockRequest({
        method: 'GET',
        query: { entityType: 'Project' },
      });
      const res = createMockResponse();

      await activityLogHandler(req, res);

      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityType: 'Project' }),
        })
      );
    });

    it('should filter by entityId', async () => {
      prisma.activityLog.findMany.mockResolvedValue([]);
      prisma.activityLog.count.mockResolvedValue(0);

      const req = createMockRequest({
        method: 'GET',
        query: { entityId: 'project-123' },
      });
      const res = createMockResponse();

      await activityLogHandler(req, res);

      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityId: 'project-123' }),
        })
      );
    });

    it('should filter by projectId', async () => {
      prisma.activityLog.findMany.mockResolvedValue([]);
      prisma.activityLog.count.mockResolvedValue(0);

      const req = createMockRequest({
        method: 'GET',
        query: { projectId: 'project-456' },
      });
      const res = createMockResponse();

      await activityLogHandler(req, res);

      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'project-456' }),
        })
      );
    });

    it('should respect custom limit and offset', async () => {
      prisma.activityLog.findMany.mockResolvedValue([]);
      prisma.activityLog.count.mockResolvedValue(0);

      const req = createMockRequest({
        method: 'GET',
        query: { limit: '10', offset: '20' },
      });
      const res = createMockResponse();

      await activityLogHandler(req, res);

      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );

      const response = getJsonResponse(res);
      expect(response.limit).toBe(10);
      expect(response.offset).toBe(20);
    });

    it('should order by createdAt descending', async () => {
      prisma.activityLog.findMany.mockResolvedValue([]);
      prisma.activityLog.count.mockResolvedValue(0);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await activityLogHandler(req, res);

      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should handle database errors', async () => {
      prisma.activityLog.findMany.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await activityLogHandler(req, res);

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

      await activityLogHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await activityLogHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it('should return 405 for DELETE requests', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponse();

      await activityLogHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });
});

