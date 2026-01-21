/**
 * Tests for projectValidators utility
 * 
 * Tests project-specific validation functions.
 */

import {
  validateProjectData,
  validateTeamMember,
  validateTeamMembers,
  validateAdminProjectData,
} from '@/lib/utils/projectValidators';

describe('projectValidators', () => {
  describe('validateProjectData', () => {
    it('should return valid for complete project data', () => {
      const data = {
        title: 'Test Project',
        startDate: '2024-01-01',
      };

      const result = validateProjectData(data);

      expect(result.isValid).toBe(true);
    });

    it('should return invalid when title is missing', () => {
      const data = {
        startDate: '2024-01-01',
      };

      const result = validateProjectData(data);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('title');
    });

    it('should return invalid when startDate is missing', () => {
      const data = {
        title: 'Test Project',
      };

      const result = validateProjectData(data);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('startDate');
    });

    it('should return invalid when both required fields are missing', () => {
      const data = {};

      const result = validateProjectData(data);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('title');
      expect(result.message).toContain('startDate');
    });

    it('should accept custom required fields', () => {
      const data = {
        name: 'Test',
      };

      const result = validateProjectData(data, ['name']);

      expect(result.isValid).toBe(true);
    });

    it('should use default required fields when not specified', () => {
      const data = {
        title: 'Test',
        startDate: '2024-01-01',
        description: 'Optional field',
      };

      const result = validateProjectData(data);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateTeamMember', () => {
    it('should return valid for team member with name', () => {
      const member = { name: 'John Doe', email: 'john@example.com' };

      const result = validateTeamMember(member);

      expect(result.isValid).toBe(true);
    });

    it('should return valid for team member with only name', () => {
      const member = { name: 'John Doe' };

      const result = validateTeamMember(member);

      expect(result.isValid).toBe(true);
    });

    it('should return invalid when name is missing', () => {
      const member = { email: 'john@example.com' };

      const result = validateTeamMember(member);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('name');
    });

    it('should return invalid when name is empty string', () => {
      const member = { name: '', email: 'john@example.com' };

      const result = validateTeamMember(member);

      expect(result.isValid).toBe(false);
    });

    it('should return invalid for empty object', () => {
      const member = {};

      const result = validateTeamMember(member);

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateTeamMembers', () => {
    it('should return valid for array of valid team members', () => {
      const team = [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Doe' },
      ];

      const result = validateTeamMembers(team);

      expect(result.isValid).toBe(true);
    });

    it('should return valid for empty array', () => {
      const result = validateTeamMembers([]);

      expect(result.isValid).toBe(true);
    });

    it('should return invalid when team is not an array', () => {
      const result = validateTeamMembers('not an array');

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('array');
    });

    it('should return invalid when team is null', () => {
      const result = validateTeamMembers(null);

      expect(result.isValid).toBe(false);
    });

    it('should return invalid when team is undefined', () => {
      const result = validateTeamMembers(undefined);

      expect(result.isValid).toBe(false);
    });

    it('should return invalid when any team member is invalid', () => {
      const team = [
        { name: 'John Doe' },
        { email: 'missing-name@example.com' }, // Missing name
      ];

      const result = validateTeamMembers(team);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('name');
    });

    it('should return first invalid member error', () => {
      const team = [
        { email: 'first-missing@example.com' },
        { email: 'second-missing@example.com' },
      ];

      const result = validateTeamMembers(team);

      expect(result.isValid).toBe(false);
    });

    it('should return invalid for object instead of array', () => {
      const result = validateTeamMembers({ name: 'John' });

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateAdminProjectData', () => {
    it('should return valid for complete admin project data', () => {
      const data = {
        title: 'Test Project',
        slug: 'test-project',
      };

      const result = validateAdminProjectData(data);

      expect(result.isValid).toBe(true);
    });

    it('should return invalid when title is missing', () => {
      const data = {
        slug: 'test-project',
      };

      const result = validateAdminProjectData(data);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('title');
    });

    it('should return invalid when slug is missing', () => {
      const data = {
        title: 'Test Project',
      };

      const result = validateAdminProjectData(data);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('slug');
    });

    it('should return invalid when both required fields are missing', () => {
      const data = {};

      const result = validateAdminProjectData(data);

      expect(result.isValid).toBe(false);
    });

    it('should accept additional optional fields', () => {
      const data = {
        title: 'Test Project',
        slug: 'test-project',
        description: 'Optional description',
        status: 'Draft',
      };

      const result = validateAdminProjectData(data);

      expect(result.isValid).toBe(true);
    });
  });
});




