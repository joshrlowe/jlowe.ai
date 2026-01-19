/**
 * Tests for /api/admin/projects.js
 *
 * Tests admin projects API route (GET/POST)
 */

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
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    projectTeamMember: {
      createMany: jest.fn(),
    },
  },
}));

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock activity logger
jest.mock('../../../lib/utils/activityLogger.js', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));

// Mock withAuth middleware
jest.mock('../../../lib/utils/authMiddleware.js', () => ({
  withAuth: (handler) => async (req, res) => {
    const token = await require('next-auth/jwt').getToken({ req });
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    return handler(req, res, token);
  },
  getUserIdFromToken: (token) => token?.email || 'unknown',
}));

// Mock createApiHandler
jest.mock('../../../lib/utils/apiRouteHandler.js', () => ({
  createApiHandler: (handlers) => async (req, res, token) => {
    const handler = handlers[req.method];
    if (!handler) {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
    return handler(req, res, token);
  },
}));

// Import handler after mocks
let adminProjectsHandler;
beforeAll(async () => {
  const module = await import('../../../pages/api/admin/projects.js');
  adminProjectsHandler = module.default;
});

describe('/api/admin/projects', () => {
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

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await adminProjectsHandler(req, res);

      expect(getStatusCode(res)).toBe(401);
    });
  });

  describe('GET requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return all projects', async () => {
      const mockProjects = [
        { id: '1', title: 'Project 1', teamMembers: [] },
        { id: '2', title: 'Project 2', teamMembers: [] },
      ];
      prisma.project.findMany.mockResolvedValue(mockProjects);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await adminProjectsHandler(req, res);

      expect(prisma.project.findMany).toHaveBeenCalled();
      expect(getJsonResponse(res)).toEqual(mockProjects);
    });

    it('should handle database errors', async () => {
      prisma.project.findMany.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await adminProjectsHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('POST requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should create project with valid data', async () => {
      const newProject = {
        id: 'proj-1',
        title: 'New Project',
        slug: 'new-project',
        teamMembers: [],
      };
      prisma.project.create.mockResolvedValue(newProject);
      prisma.project.findUnique.mockResolvedValue(newProject);

      const req = createMockRequest({
        method: 'POST',
        body: {
          title: 'New Project',
          slug: 'new-project',
          shortDescription: 'A new project',
        },
      });
      const res = createMockResponse();

      await adminProjectsHandler(req, res);

      expect(prisma.project.create).toHaveBeenCalled();
      expect(getStatusCode(res)).toBe(201);
    });

    it('should return 400 when title is missing', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { slug: 'test-slug' },
      });
      const res = createMockResponse();

      await adminProjectsHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });

    it('should return 400 when slug is missing', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { title: 'Test Title' },
      });
      const res = createMockResponse();

      await adminProjectsHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });

    it('should handle unique constraint violation', async () => {
      const uniqueError = new Error('Unique constraint');
      uniqueError.code = 'P2002';
      prisma.project.create.mockRejectedValue(uniqueError);

      const req = createMockRequest({
        method: 'POST',
        body: {
          title: 'Duplicate Project',
          slug: 'duplicate-slug',
        },
      });
      const res = createMockResponse();

      await adminProjectsHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('A project with this slug already exists');
    });

    it('should create team members if provided', async () => {
      const newProject = { id: 'proj-1', title: 'Test' };
      prisma.project.create.mockResolvedValue(newProject);
      prisma.project.findUnique.mockResolvedValue({
        ...newProject,
        teamMembers: [{ name: 'John', email: 'john@test.com' }],
      });
      prisma.projectTeamMember.createMany.mockResolvedValue({ count: 1 });

      const req = createMockRequest({
        method: 'POST',
        body: {
          title: 'Test Project',
          slug: 'test-project',
          teamMembers: [{ name: 'John', email: 'john@test.com' }],
        },
      });
      const res = createMockResponse();

      await adminProjectsHandler(req, res);

      expect(prisma.projectTeamMember.createMany).toHaveBeenCalled();
    });
  });

  describe('HTTP method restrictions', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await adminProjectsHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it('should return 405 for DELETE requests', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponse();

      await adminProjectsHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });
});

