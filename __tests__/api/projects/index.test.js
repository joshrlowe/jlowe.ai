/**
 * Tests for /api/projects/index.js
 *
 * Tests projects CRUD API route
 */

import projectsHandler from '../../../pages/api/projects/index.js';
import prisma from '../../../lib/prisma.js';
import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from '../../setup/api-test-utils.js';

jest.mock('../../../lib/prisma.js', () => ({
  __esModule: true,
  default: {
    project: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('/api/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validProjectData = {
    title: 'AI Chatbot Platform',
    description: 'An intelligent chatbot solution',
    techStack: ['Python', 'TensorFlow', 'React'],
    repositoryLink: 'https://github.com/user/project',
    startDate: '2023-01-01',
    releaseDate: '2023-06-01',
    status: 'Published',
    team: [
      { name: 'Josh Lowe', role: 'Lead Developer' },
      { name: 'Jane Doe', role: 'Designer' },
    ],
  };

  describe('GET requests', () => {
    it('should return all projects with 200', async () => {
      const mockProjects = [
        {
          id: '1',
          title: 'Project 1',
          startDate: new Date('2023-01-01'),
          teamMembers: [],
        },
        {
          id: '2',
          title: 'Project 2',
          startDate: new Date('2022-01-01'),
          teamMembers: [],
        },
      ];

      prisma.project.findMany.mockResolvedValue(mockProjects);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        take: 100,
        orderBy: { startDate: 'desc' },
        include: { teamMembers: true },
      });
      expect(getStatusCode(res)).toBe(200);
      expect(Array.isArray(getJsonResponse(res))).toBe(true);
    });

    it('should return empty array when no projects exist', async () => {
      prisma.project.findMany.mockResolvedValue([]);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
      expect(getJsonResponse(res)).toEqual([]);
    });

    it('should limit to 100 projects', async () => {
      prisma.project.findMany.mockResolvedValue([]);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });

    it('should handle database errors with 500', async () => {
      prisma.project.findMany.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('POST requests', () => {
    it('should create project with valid input', async () => {
      const mockCreatedProject = {
        id: '1',
        title: validProjectData.title,
        description: validProjectData.description,
        techStack: validProjectData.techStack,
        repositoryLink: validProjectData.repositoryLink,
        startDate: new Date(validProjectData.startDate),
        releaseDate: new Date(validProjectData.releaseDate),
        status: 'Published',
        teamMembers: [
          { id: '1', name: 'Josh Lowe', role: 'Lead Developer' },
          { id: '2', name: 'Jane Doe', role: 'Designer' },
        ],
      };

      prisma.project.create.mockResolvedValue(mockCreatedProject);

      const req = createMockRequest({
        method: 'POST',
        body: validProjectData,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: validProjectData.title,
          description: validProjectData.description,
          repositoryLink: validProjectData.repositoryLink,
        }),
        include: { teamMembers: true },
      });
      expect(getStatusCode(res)).toBe(201);
    });

    it('should return 400 when title is missing', async () => {
      const invalidData = { ...validProjectData };
      delete invalidData.title;

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('title');
    });

    it('should return 400 when startDate is missing', async () => {
      const invalidData = { ...validProjectData };
      delete invalidData.startDate;

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('startDate');
    });

    it('should handle optional fields', async () => {
      const minimalData = {
        title: 'Minimal Project',
        startDate: '2023-01-01',
        team: [],
      };

      prisma.project.create.mockResolvedValue({
        id: '1',
        ...minimalData,
        description: null,
        repositoryLink: null,
        releaseDate: null,
        techStack: null,
        status: 'Draft',
        teamMembers: [],
      });

      const req = createMockRequest({
        method: 'POST',
        body: minimalData,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should return 400 when team validation fails', async () => {
      const invalidData = {
        ...validProjectData,
        team: 'Not an array',
      };

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('Team must be an array');
    });

    it('should map status correctly for valid status', async () => {
      const dataWithStatus = {
        ...validProjectData,
        status: 'Completed',
      };

      prisma.project.create.mockResolvedValue({
        id: '1',
        ...dataWithStatus,
        status: 'Completed',
        teamMembers: [],
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithStatus,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'Completed',
          }),
        })
      );
    });

    it('should handle unmapped status as null', async () => {
      const dataWithUnmappedStatus = {
        ...validProjectData,
        status: 'InvalidStatus',
      };

      prisma.project.create.mockResolvedValue({
        id: '1',
        title: dataWithUnmappedStatus.title,
        status: null,
        teamMembers: [],
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithUnmappedStatus,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: null,
          }),
        })
      );
    });

    it('should handle database errors with 500', async () => {
      prisma.project.create.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'POST',
        body: validProjectData,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('HTTP method restrictions', () => {
    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toContain('Method Not Allowed');
    });

    it('should return 405 for DELETE requests', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it('should return 405 for PATCH requests', async () => {
      const req = createMockRequest({ method: 'PATCH' });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty team array', async () => {
      const dataWithEmptyTeam = {
        ...validProjectData,
        team: [],
      };

      prisma.project.create.mockResolvedValue({
        id: '1',
        ...dataWithEmptyTeam,
        teamMembers: [],
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithEmptyTeam,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should handle null releaseDate', async () => {
      const dataWithNullRelease = {
        ...validProjectData,
        releaseDate: null,
      };

      prisma.project.create.mockResolvedValue({
        id: '1',
        ...dataWithNullRelease,
        teamMembers: [],
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithNullRelease,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            releaseDate: null,
          }),
        })
      );
    });

    it('should handle special characters in title', async () => {
      const dataWithSpecialChars = {
        ...validProjectData,
        title: "O'Brien's Project <script>alert('xss')</script>",
      };

      prisma.project.create.mockResolvedValue({
        id: '1',
        ...dataWithSpecialChars,
        teamMembers: [],
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithSpecialChars,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should handle very long techStack array', async () => {
      const dataWithLongTechStack = {
        ...validProjectData,
        techStack: Array(100).fill('Technology'),
      };

      prisma.project.create.mockResolvedValue({
        id: '1',
        ...dataWithLongTechStack,
        teamMembers: [],
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithLongTechStack,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should handle invalid date format', async () => {
      const dataWithInvalidDate = {
        ...validProjectData,
        startDate: 'not-a-date',
      };

      prisma.project.create.mockRejectedValue(new Error('Invalid date'));

      const req = createMockRequest({
        method: 'POST',
        body: dataWithInvalidDate,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });

    it('should handle team members with missing fields', async () => {
      const dataWithIncompleteTeam = {
        ...validProjectData,
        team: [{ name: 'John' }, { name: 'Jane' }],
      };

      prisma.project.create.mockResolvedValue({
        id: '1',
        title: dataWithIncompleteTeam.title,
        teamMembers: [
          { id: '1', name: 'John', email: null },
          { id: '2', name: 'Jane', email: null },
        ],
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithIncompleteTeam,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
      expect(prisma.project.create).toHaveBeenCalled();
    });

    it('should handle optional description being null', async () => {
      const dataWithNullDescription = {
        title: 'Project Without Description',
        startDate: '2023-01-01',
        description: null,
        team: [],
      };

      prisma.project.create.mockResolvedValue({
        id: '1',
        ...dataWithNullDescription,
        description: null,
        teamMembers: [],
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithNullDescription,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: null,
          }),
        })
      );
    });

    it('should handle optional repositoryLink being null', async () => {
      const dataWithNullRepo = {
        title: 'Project Without Repo',
        startDate: '2023-01-01',
        repositoryLink: null,
        team: [],
      };

      prisma.project.create.mockResolvedValue({
        id: '1',
        ...dataWithNullRepo,
        repositoryLink: null,
        teamMembers: [],
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithNullRepo,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            repositoryLink: null,
          }),
        })
      );
    });

    it('should handle optional techStack being null', async () => {
      const dataWithNullTech = {
        title: 'Project Without Tech',
        startDate: '2023-01-01',
        techStack: null,
        team: [],
      };

      prisma.project.create.mockResolvedValue({
        id: '1',
        ...dataWithNullTech,
        techStack: null,
        teamMembers: [],
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithNullTech,
      });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            techStack: null,
          }),
        })
      );
    });
  });
});

