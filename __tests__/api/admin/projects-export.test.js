/**
 * Tests for /api/admin/projects/export.js
 *
 * Tests admin projects export API route (GET)
 */

import exportHandler from '../../../pages/api/admin/projects/export.js';
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
      findMany: jest.fn(),
    },
  },
}));

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

describe('/api/admin/projects/export', () => {
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

      await exportHandler(req, res);

      expect(getStatusCode(res)).toBe(401);
      expect(getJsonResponse(res).message).toBe('Unauthorized');
    });
  });

  describe('HTTP method restrictions', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return 405 for POST requests', async () => {
      const req = createMockRequest({ method: 'POST' });
      const res = createMockResponse();

      await exportHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await exportHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });

  describe('GET requests - JSON format', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should export projects as JSON by default', async () => {
      const mockProjects = [
        {
          id: '1',
          title: 'Project 1',
          slug: 'project-1',
          status: 'Published',
          teamMembers: [],
        },
        {
          id: '2',
          title: 'Project 2',
          slug: 'project-2',
          status: 'Draft',
          teamMembers: [],
        },
      ];
      prisma.project.findMany.mockResolvedValue(mockProjects);

      const req = createMockRequest({ method: 'GET' });
      const res = {
        ...createMockResponse(),
        setHeader: jest.fn(),
      };

      await exportHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename="projects-')
      );
      expect(getJsonResponse(res)).toEqual(mockProjects);
    });

    it('should export projects as JSON when format=json', async () => {
      prisma.project.findMany.mockResolvedValue([]);

      const req = createMockRequest({
        method: 'GET',
        query: { format: 'json' },
      });
      const res = {
        ...createMockResponse(),
        setHeader: jest.fn(),
      };

      await exportHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    });

    it('should include teamMembers in the export', async () => {
      prisma.project.findMany.mockResolvedValue([]);

      const req = createMockRequest({ method: 'GET' });
      const res = {
        ...createMockResponse(),
        setHeader: jest.fn(),
      };

      await exportHandler(req, res);

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { teamMembers: true },
        })
      );
    });

    it('should order by createdAt descending', async () => {
      prisma.project.findMany.mockResolvedValue([]);

      const req = createMockRequest({ method: 'GET' });
      const res = {
        ...createMockResponse(),
        setHeader: jest.fn(),
      };

      await exportHandler(req, res);

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('GET requests - CSV format', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should export projects as CSV when format=csv', async () => {
      const mockProjects = [
        {
          id: '1',
          title: 'Project 1',
          slug: 'project-1',
          shortDescription: 'Description 1',
          status: 'Published',
          featured: true,
          startDate: new Date('2024-01-01'),
          releaseDate: new Date('2024-06-01'),
          tags: ['react', 'typescript'],
          techStack: ['Next.js', 'Prisma'],
          links: { github: 'https://github.com/test', live: 'https://test.com' },
          teamMembers: [],
        },
      ];
      prisma.project.findMany.mockResolvedValue(mockProjects);

      const req = createMockRequest({
        method: 'GET',
        query: { format: 'csv' },
      });
      const res = {
        ...createMockResponse(),
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await exportHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename="projects-')
      );
      expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Title'));
    });

    it('should include CSV headers', async () => {
      prisma.project.findMany.mockResolvedValue([]);

      const req = createMockRequest({
        method: 'GET',
        query: { format: 'csv' },
      });
      const res = {
        ...createMockResponse(),
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await exportHandler(req, res);

      const csvContent = res.send.mock.calls[0][0];
      expect(csvContent).toContain('"Title"');
      expect(csvContent).toContain('"Slug"');
      expect(csvContent).toContain('"Status"');
      expect(csvContent).toContain('"Featured"');
    });

    it('should handle projects with null values', async () => {
      const mockProjects = [
        {
          id: '1',
          title: 'Project 1',
          slug: 'project-1',
          shortDescription: null,
          status: 'Draft',
          featured: false,
          startDate: null,
          releaseDate: null,
          tags: null,
          techStack: null,
          links: null,
          teamMembers: [],
        },
      ];
      prisma.project.findMany.mockResolvedValue(mockProjects);

      const req = createMockRequest({
        method: 'GET',
        query: { format: 'csv' },
      });
      const res = {
        ...createMockResponse(),
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await exportHandler(req, res);

      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should handle database errors', async () => {
      prisma.project.findMany.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({ method: 'GET' });
      const res = {
        ...createMockResponse(),
        setHeader: jest.fn(),
      };

      await exportHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });
});

