/**
 * Tests for lib/utils/projectTransformer.js
 *
 * Tests project data transformation between Prisma and API formats
 */

import {
  transformProjectToApiFormat,
  transformProjectsToApiFormat,
  transformTeamToTeamMembers,
} from '../../../lib/utils/projectTransformer.js';

describe('projectTransformer', () => {
  describe('transformProjectToApiFormat', () => {
    it('should transform a project with teamMembers to API format with team', () => {
      const prismaProject = {
        id: '1',
        title: 'Test Project',
        description: 'A test project',
        teamMembers: [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Doe', email: 'jane@example.com' },
        ],
      };

      const result = transformProjectToApiFormat(prismaProject);

      expect(result).toEqual({
        id: '1',
        title: 'Test Project',
        description: 'A test project',
        team: [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Doe', email: 'jane@example.com' },
        ],
      });
      expect(result.teamMembers).toBeUndefined();
    });

    it('should handle project with empty teamMembers array', () => {
      const prismaProject = {
        id: '1',
        title: 'Solo Project',
        teamMembers: [],
      };

      const result = transformProjectToApiFormat(prismaProject);

      expect(result.team).toEqual([]);
      expect(result.teamMembers).toBeUndefined();
    });

    it('should handle project with null teamMembers', () => {
      const prismaProject = {
        id: '1',
        title: 'Project Without Team',
        teamMembers: null,
      };

      const result = transformProjectToApiFormat(prismaProject);

      expect(result.team).toEqual([]);
      expect(result.teamMembers).toBeUndefined();
    });

    it('should handle project with undefined teamMembers', () => {
      const prismaProject = {
        id: '1',
        title: 'Project Without Team',
      };

      const result = transformProjectToApiFormat(prismaProject);

      expect(result.team).toEqual([]);
    });

    it('should preserve all other project properties', () => {
      const prismaProject = {
        id: '1',
        title: 'Full Project',
        description: 'Description',
        techStack: ['React', 'Node.js'],
        repositoryLink: 'https://github.com/test/project',
        startDate: new Date('2023-01-01'),
        releaseDate: new Date('2023-06-01'),
        status: 'Published',
        images: ['image1.png', 'image2.png'],
        liveUrl: 'https://example.com',
        teamMembers: [{ name: 'Test', email: 'test@test.com' }],
      };

      const result = transformProjectToApiFormat(prismaProject);

      expect(result.id).toBe('1');
      expect(result.title).toBe('Full Project');
      expect(result.description).toBe('Description');
      expect(result.techStack).toEqual(['React', 'Node.js']);
      expect(result.repositoryLink).toBe('https://github.com/test/project');
      expect(result.startDate).toEqual(new Date('2023-01-01'));
      expect(result.releaseDate).toEqual(new Date('2023-06-01'));
      expect(result.status).toBe('Published');
      expect(result.images).toEqual(['image1.png', 'image2.png']);
      expect(result.liveUrl).toBe('https://example.com');
    });
  });

  describe('transformProjectsToApiFormat', () => {
    it('should transform an array of projects', () => {
      const prismaProjects = [
        {
          id: '1',
          title: 'Project 1',
          teamMembers: [{ name: 'John', email: 'john@test.com' }],
        },
        {
          id: '2',
          title: 'Project 2',
          teamMembers: [{ name: 'Jane', email: 'jane@test.com' }],
        },
      ];

      const result = transformProjectsToApiFormat(prismaProjects);

      expect(result).toHaveLength(2);
      expect(result[0].team).toEqual([{ name: 'John', email: 'john@test.com' }]);
      expect(result[1].team).toEqual([{ name: 'Jane', email: 'jane@test.com' }]);
      expect(result[0].teamMembers).toBeUndefined();
      expect(result[1].teamMembers).toBeUndefined();
    });

    it('should handle empty array', () => {
      const result = transformProjectsToApiFormat([]);
      expect(result).toEqual([]);
    });

    it('should handle array with mixed teamMembers states', () => {
      const prismaProjects = [
        { id: '1', title: 'With Team', teamMembers: [{ name: 'John', email: 'j@t.com' }] },
        { id: '2', title: 'Empty Team', teamMembers: [] },
        { id: '3', title: 'Null Team', teamMembers: null },
      ];

      const result = transformProjectsToApiFormat(prismaProjects);

      expect(result[0].team).toHaveLength(1);
      expect(result[1].team).toEqual([]);
      expect(result[2].team).toEqual([]);
    });
  });

  describe('transformTeamToTeamMembers', () => {
    it('should transform team array to Prisma create format', () => {
      const team = [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Doe', email: 'jane@example.com' },
      ];

      const result = transformTeamToTeamMembers(team);

      expect(result).toEqual([
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Doe', email: 'jane@example.com' },
      ]);
    });

    it('should handle team members without email', () => {
      const team = [
        { name: 'John Doe' },
        { name: 'Jane Doe', email: undefined },
      ];

      const result = transformTeamToTeamMembers(team);

      expect(result).toEqual([
        { name: 'John Doe', email: null },
        { name: 'Jane Doe', email: null },
      ]);
    });

    it('should handle empty array', () => {
      const result = transformTeamToTeamMembers([]);
      expect(result).toEqual([]);
    });

    it('should return empty array for non-array input', () => {
      expect(transformTeamToTeamMembers(null)).toEqual([]);
      expect(transformTeamToTeamMembers(undefined)).toEqual([]);
      expect(transformTeamToTeamMembers('not an array')).toEqual([]);
      expect(transformTeamToTeamMembers(123)).toEqual([]);
      expect(transformTeamToTeamMembers({})).toEqual([]);
    });

    it('should handle team member with empty email string', () => {
      const team = [{ name: 'John', email: '' }];
      const result = transformTeamToTeamMembers(team);
      expect(result).toEqual([{ name: 'John', email: null }]);
    });
  });
});

