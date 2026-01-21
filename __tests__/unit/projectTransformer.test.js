/**
 * Tests for projectTransformer utility
 * 
 * Tests transformation of project data between Prisma and API formats.
 */

import {
  transformProjectToApiFormat,
  transformProjectsToApiFormat,
  transformTeamToTeamMembers,
} from '@/lib/utils/projectTransformer';

describe('projectTransformer', () => {
  describe('transformProjectToApiFormat', () => {
    it('should transform project with teamMembers to team array format', () => {
      const project = {
        id: '1',
        title: 'Test Project',
        teamMembers: [
          { id: 'tm1', name: 'John Doe', email: 'john@example.com' },
          { id: 'tm2', name: 'Jane Doe', email: 'jane@example.com' },
        ],
      };

      const result = transformProjectToApiFormat(project);

      expect(result.id).toBe('1');
      expect(result.title).toBe('Test Project');
      expect(result.teamMembers).toBeUndefined();
      expect(result.team).toEqual([
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Doe', email: 'jane@example.com' },
      ]);
    });

    it('should handle empty teamMembers array', () => {
      const project = {
        id: '1',
        title: 'Test Project',
        teamMembers: [],
      };

      const result = transformProjectToApiFormat(project);

      expect(result.team).toEqual([]);
    });

    it('should handle undefined teamMembers', () => {
      const project = {
        id: '1',
        title: 'Test Project',
      };

      const result = transformProjectToApiFormat(project);

      expect(result.team).toEqual([]);
    });

    it('should handle null teamMembers', () => {
      const project = {
        id: '1',
        title: 'Test Project',
        teamMembers: null,
      };

      const result = transformProjectToApiFormat(project);

      expect(result.team).toEqual([]);
    });

    it('should preserve all other project properties', () => {
      const project = {
        id: '1',
        title: 'Test Project',
        description: 'Test description',
        status: 'Published',
        createdAt: '2024-01-01',
        teamMembers: [],
      };

      const result = transformProjectToApiFormat(project);

      expect(result.id).toBe('1');
      expect(result.title).toBe('Test Project');
      expect(result.description).toBe('Test description');
      expect(result.status).toBe('Published');
      expect(result.createdAt).toBe('2024-01-01');
    });
  });

  describe('transformProjectsToApiFormat', () => {
    it('should transform array of projects', () => {
      const projects = [
        { id: '1', title: 'Project 1', teamMembers: [{ name: 'John', email: 'john@test.com' }] },
        { id: '2', title: 'Project 2', teamMembers: [] },
      ];

      const result = transformProjectsToApiFormat(projects);

      expect(result).toHaveLength(2);
      expect(result[0].team).toEqual([{ name: 'John', email: 'john@test.com' }]);
      expect(result[1].team).toEqual([]);
    });

    it('should handle empty array', () => {
      const result = transformProjectsToApiFormat([]);
      expect(result).toEqual([]);
    });
  });

  describe('transformTeamToTeamMembers', () => {
    it('should transform team array to Prisma format', () => {
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

    it('should return empty array for non-array input', () => {
      expect(transformTeamToTeamMembers(null)).toEqual([]);
      expect(transformTeamToTeamMembers(undefined)).toEqual([]);
      expect(transformTeamToTeamMembers('not an array')).toEqual([]);
      expect(transformTeamToTeamMembers({})).toEqual([]);
      expect(transformTeamToTeamMembers(123)).toEqual([]);
    });

    it('should handle empty array', () => {
      expect(transformTeamToTeamMembers([])).toEqual([]);
    });
  });
});




