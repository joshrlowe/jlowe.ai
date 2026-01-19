/**
 * Tests for /api/admin/projects/import.js
 *
 * Tests admin projects import API route (POST)
 */

import importHandler from '../../../pages/api/admin/projects/import.js';
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
      create: jest.fn(),
    },
  },
}));

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

describe('/api/admin/projects/import', () => {
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
        body: { projects: [] },
      });
      const res = createMockResponse();

      await importHandler(req, res);

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

      await importHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await importHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });

  describe('POST requests - import projects', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should import valid projects', async () => {
      const createdProject = {
        id: '1',
        title: 'Imported Project',
        slug: 'imported-project',
      };
      prisma.project.create.mockResolvedValue(createdProject);

      const req = createMockRequest({
        method: 'POST',
        body: {
          projects: [
            {
              title: 'Imported Project',
              slug: 'imported-project',
              shortDescription: 'Description',
            },
          ],
        },
      });
      const res = createMockResponse();

      await importHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.results.successful).toContainEqual(createdProject);
      expect(response.results.failed).toHaveLength(0);
      expect(response.message).toContain('Imported 1 project(s)');
    });

    it('should return 400 when projects is not an array', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { projects: 'not-an-array' },
      });
      const res = createMockResponse();

      await importHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('Projects must be an array');
    });

    it('should fail projects without required fields', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          projects: [
            { title: 'No Slug' }, // Missing slug
            { slug: 'no-title' }, // Missing title
          ],
        },
      });
      const res = createMockResponse();

      await importHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.results.successful).toHaveLength(0);
      expect(response.results.failed).toHaveLength(2);
      expect(response.results.failed[0].error).toBe('Title and slug are required');
    });

    it('should handle mixed success and failure', async () => {
      prisma.project.create
        .mockResolvedValueOnce({ id: '1', title: 'Valid Project', slug: 'valid' })
        .mockRejectedValueOnce(new Error('Duplicate slug'));

      const req = createMockRequest({
        method: 'POST',
        body: {
          projects: [
            { title: 'Valid Project', slug: 'valid' },
            { title: 'Invalid Project', slug: 'duplicate' },
          ],
        },
      });
      const res = createMockResponse();

      await importHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.results.successful).toHaveLength(1);
      expect(response.results.failed).toHaveLength(1);
      expect(response.message).toBe('Imported 1 project(s), 1 failed');
    });

    it('should set default values for optional fields', async () => {
      prisma.project.create.mockResolvedValue({ id: '1' });

      const req = createMockRequest({
        method: 'POST',
        body: {
          projects: [
            {
              title: 'Minimal Project',
              slug: 'minimal',
            },
          ],
        },
      });
      const res = createMockResponse();

      await importHandler(req, res);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Minimal Project',
          slug: 'minimal',
          shortDescription: '',
          longDescription: '',
          tags: [],
          techStack: [],
          links: {},
          images: [],
          featured: false,
        }),
      });
    });

    it('should map status using projectStatusMapper', async () => {
      prisma.project.create.mockResolvedValue({ id: '1' });

      const req = createMockRequest({
        method: 'POST',
        body: {
          projects: [
            {
              title: 'Project',
              slug: 'project',
              status: 'In Progress',
            },
          ],
        },
      });
      const res = createMockResponse();

      await importHandler(req, res);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'InProgress',
        }),
      });
    });

    it('should handle date fields', async () => {
      prisma.project.create.mockResolvedValue({ id: '1' });

      const req = createMockRequest({
        method: 'POST',
        body: {
          projects: [
            {
              title: 'Project',
              slug: 'project',
              startDate: '2024-01-01',
              releaseDate: '2024-06-01',
            },
          ],
        },
      });
      const res = createMockResponse();

      await importHandler(req, res);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          startDate: expect.any(Date),
          releaseDate: expect.any(Date),
        }),
      });
    });

    it('should handle empty projects array', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { projects: [] },
      });
      const res = createMockResponse();

      await importHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.message).toBe('Imported 0 project(s), 0 failed');
      expect(response.results.successful).toHaveLength(0);
      expect(response.results.failed).toHaveLength(0);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should handle database errors', async () => {
      prisma.project.create.mockRejectedValue(new Error('Connection failed'));

      const req = createMockRequest({
        method: 'POST',
        body: {
          projects: [{ title: 'Project', slug: 'project' }],
        },
      });
      const res = createMockResponse();

      await importHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.results.failed).toHaveLength(1);
      expect(response.results.failed[0].error).toBe('Connection failed');
    });
  });
});

