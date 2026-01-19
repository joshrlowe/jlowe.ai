/**
 * Tests for /api/admin/projects/[id].js
 *
 * Tests admin projects CRUD by ID API route
 */

import projectsIdHandler from '../../../pages/api/admin/projects/[id].js';
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
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectTeamMember: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock projectStatusMapper
jest.mock('../../../lib/utils/projectStatusMapper.js', () => ({
  mapProjectStatus: jest.fn((status) => status),
}));

// Mock activityLogger
jest.mock('../../../lib/utils/activityLogger.js', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));

describe('/api/admin/projects/[id]', () => {
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

      const req = createMockRequest({ method: 'GET', query: { id: 'project-1' } });
      const res = createMockResponse();

      await projectsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(401);
      expect(getJsonResponse(res).message).toBe('Unauthorized');
    });
  });

  describe('GET requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return project by ID with team members', async () => {
      const mockProject = {
        id: 'project-1',
        title: 'Test Project',
        slug: 'test-project',
        status: 'Published',
        teamMembers: [
          { id: 'tm-1', name: 'John Doe', email: 'john@test.com' },
        ],
      };
      prisma.project.findUnique.mockResolvedValue(mockProject);

      const req = createMockRequest({ method: 'GET', query: { id: 'project-1' } });
      const res = createMockResponse();

      await projectsIdHandler(req, res);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        include: { teamMembers: true },
      });
      expect(getJsonResponse(res)).toEqual(mockProject);
    });

    it('should return 404 when project not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET', query: { id: 'non-existent' } });
      const res = createMockResponse();

      await projectsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(404);
      expect(getJsonResponse(res).message).toBe('Project not found');
    });

    it('should handle database errors', async () => {
      prisma.project.findUnique.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({ method: 'GET', query: { id: 'project-1' } });
      const res = createMockResponse();

      await projectsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('PUT requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should update project with provided data', async () => {
      const existingProject = { id: 'project-1', title: 'Old Title' };
      prisma.project.findUnique
        .mockResolvedValueOnce(existingProject)
        .mockResolvedValueOnce({
          ...existingProject,
          title: 'Updated Title',
          teamMembers: [],
        });
      prisma.project.update.mockResolvedValue({
        id: 'project-1',
        title: 'Updated Title',
        teamMembers: [],
      });

      const req = createMockRequest({
        method: 'PUT',
        query: { id: 'project-1' },
        body: { title: 'Updated Title' },
      });
      const res = createMockResponse();

      await projectsIdHandler(req, res);

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: expect.objectContaining({
          title: 'Updated Title',
        }),
        include: { teamMembers: true },
      });
    });

    it('should return 404 if project not found on update', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'PUT',
        query: { id: 'non-existent' },
        body: { title: 'Test' },
      });
      const res = createMockResponse();

      await projectsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(404);
      expect(getJsonResponse(res).message).toBe('Project not found');
    });

    it('should update team members when provided', async () => {
      const existingProject = { id: 'project-1', title: 'Test' };
      prisma.project.findUnique
        .mockResolvedValueOnce(existingProject)
        .mockResolvedValueOnce({
          ...existingProject,
          teamMembers: [{ name: 'New Member', email: 'new@test.com' }],
        });
      prisma.project.update.mockResolvedValue({ id: 'project-1' });
      prisma.projectTeamMember.deleteMany.mockResolvedValue({ count: 1 });
      prisma.projectTeamMember.createMany.mockResolvedValue({ count: 1 });

      const req = createMockRequest({
        method: 'PUT',
        query: { id: 'project-1' },
        body: {
          teamMembers: [{ name: 'New Member', email: 'new@test.com' }],
        },
      });
      const res = createMockResponse();

      await projectsIdHandler(req, res);

      expect(prisma.projectTeamMember.deleteMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
      });
      expect(prisma.projectTeamMember.createMany).toHaveBeenCalledWith({
        data: [
          { projectId: 'project-1', name: 'New Member', email: 'new@test.com' },
        ],
      });
    });

    it('should handle date conversions', async () => {
      const existingProject = { id: 'project-1', title: 'Test' };
      prisma.project.findUnique
        .mockResolvedValueOnce(existingProject)
        .mockResolvedValueOnce(existingProject);
      prisma.project.update.mockResolvedValue({ id: 'project-1' });

      const req = createMockRequest({
        method: 'PUT',
        query: { id: 'project-1' },
        body: {
          startDate: '2024-01-01',
          releaseDate: '2024-06-01',
        },
      });
      const res = createMockResponse();

      await projectsIdHandler(req, res);

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: expect.objectContaining({
          startDate: expect.any(Date),
          releaseDate: expect.any(Date),
        }),
        include: { teamMembers: true },
      });
    });

    it('should handle P2002 unique constraint error', async () => {
      const existingProject = { id: 'project-1', title: 'Test' };
      prisma.project.findUnique.mockResolvedValue(existingProject);
      const uniqueError = new Error('Unique constraint');
      uniqueError.code = 'P2002';
      prisma.project.update.mockRejectedValue(uniqueError);

      const req = createMockRequest({
        method: 'PUT',
        query: { id: 'project-1' },
        body: { slug: 'existing-slug' },
      });
      const res = createMockResponse();

      await projectsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toBe('A project with this slug already exists');
    });
  });

  describe('DELETE requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should delete project and log activity', async () => {
      const mockProject = { id: 'project-1', title: 'Test Project' };
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.project.delete.mockResolvedValue(mockProject);

      const { logActivity } = require('../../../lib/utils/activityLogger.js');

      const req = createMockRequest({
        method: 'DELETE',
        query: { id: 'project-1' },
      });
      const res = createMockResponse();

      await projectsIdHandler(req, res);

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'project-1' },
      });
      expect(logActivity).toHaveBeenCalledWith({
        userId: 'admin@test.com',
        entityType: 'Project',
        entityId: 'project-1',
        projectId: 'project-1',
        action: 'delete',
        description: 'Project "Test Project" deleted',
      });
      expect(getJsonResponse(res).message).toBe('Project deleted successfully');
    });

    it('should return 404 if project not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'DELETE',
        query: { id: 'non-existent' },
      });
      const res = createMockResponse();

      await projectsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(404);
      expect(getJsonResponse(res).message).toBe('Project not found');
    });

    it('should handle database errors', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'project-1', title: 'Test' });
      prisma.project.delete.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'DELETE',
        query: { id: 'project-1' },
      });
      const res = createMockResponse();

      await projectsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('HTTP method restrictions', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return 405 for POST requests', async () => {
      const req = createMockRequest({
        method: 'POST',
        query: { id: 'project-1' },
      });
      const res = createMockResponse();

      await projectsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for PATCH requests', async () => {
      const req = createMockRequest({
        method: 'PATCH',
        query: { id: 'project-1' },
      });
      const res = createMockResponse();

      await projectsIdHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });
});

