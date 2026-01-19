/**
 * Tests for /api/projects/[id].js
 *
 * Tests public project detail API route (GET)
 */

import projectHandler from '../../../pages/api/projects/[id].js';
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
    project: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock project transformer
jest.mock('../../../lib/utils/projectTransformer.js', () => ({
  transformProjectToApiFormat: jest.fn((project) => ({
    ...project,
    transformed: true,
  })),
}));

describe('/api/projects/[id]', () => {
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
    it('should return a project by id', async () => {
      const mockProject = {
        id: 'project-123',
        title: 'Test Project',
        slug: 'test-project',
        shortDescription: 'A test project',
        status: 'Published',
        teamMembers: [{ id: '1', name: 'Josh' }],
      };
      prisma.project.findUnique.mockResolvedValue(mockProject);

      const req = createMockRequest({
        method: 'GET',
        query: { id: 'project-123' },
      });
      const res = createMockResponse();

      await projectHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.title).toBe('Test Project');
      expect(response.transformed).toBe(true);
    });

    it('should include teamMembers in the query', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: '1',
        title: 'Test',
        teamMembers: [],
      });

      const req = createMockRequest({
        method: 'GET',
        query: { id: '1' },
      });
      const res = createMockResponse();

      await projectHandler(req, res);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { teamMembers: true },
      });
    });

    it('should return 404 when project not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'GET',
        query: { id: 'nonexistent-id' },
      });
      const res = createMockResponse();

      await projectHandler(req, res);

      expect(getStatusCode(res)).toBe(404);
      expect(getJsonResponse(res).message).toBe('Project not found');
    });

    it('should return 400 when id is missing', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {},
      });
      const res = createMockResponse();

      await projectHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('Project ID is required');
    });

    it('should transform project using projectTransformer', async () => {
      const mockProject = {
        id: '1',
        title: 'Test',
        teamMembers: [],
      };
      prisma.project.findUnique.mockResolvedValue(mockProject);

      const req = createMockRequest({
        method: 'GET',
        query: { id: '1' },
      });
      const res = createMockResponse();

      await projectHandler(req, res);

      const { transformProjectToApiFormat } = require('../../../lib/utils/projectTransformer.js');
      expect(transformProjectToApiFormat).toHaveBeenCalledWith(mockProject);
    });

    it('should handle database errors', async () => {
      prisma.project.findUnique.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'GET',
        query: { id: '1' },
      });
      const res = createMockResponse();

      await projectHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('HTTP method restrictions', () => {
    it('should return 405 for POST requests', async () => {
      const req = createMockRequest({
        method: 'POST',
        query: { id: '1' },
      });
      const res = createMockResponse();

      await projectHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({
        method: 'PUT',
        query: { id: '1' },
      });
      const res = createMockResponse();

      await projectHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it('should return 405 for DELETE requests', async () => {
      const req = createMockRequest({
        method: 'DELETE',
        query: { id: '1' },
      });
      const res = createMockResponse();

      await projectHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it('should return 405 for PATCH requests', async () => {
      const req = createMockRequest({
        method: 'PATCH',
        query: { id: '1' },
      });
      const res = createMockResponse();

      await projectHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });
});

