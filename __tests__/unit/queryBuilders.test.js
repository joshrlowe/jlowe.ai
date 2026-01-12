/**
 * Tests for queryBuilders utility
 * 
 * Tests Prisma query building functions for posts and projects.
 */

import {
  buildPostWhereClause,
  buildProjectWhereClause,
  buildPostIncludeClause,
  buildProjectIncludeClause,
  buildPostQuery,
  buildProjectQuery,
} from '@/lib/utils/queryBuilders';

describe('queryBuilders', () => {
  describe('buildPostWhereClause', () => {
    it('should build where clause with status filter', () => {
      const result = buildPostWhereClause({ status: 'Published' });
      
      expect(result.status).toBe('Published');
    });

    it('should exclude status when "all" is specified', () => {
      const result = buildPostWhereClause({ status: 'all' });
      
      expect(result.status).toBeUndefined();
    });

    it('should build where clause with topic filter (lowercased)', () => {
      const result = buildPostWhereClause({ topic: 'React' });
      
      expect(result.topic).toBe('react');
    });

    it('should build where clause with search filter', () => {
      const result = buildPostWhereClause({ search: 'test' });
      
      expect(result.OR).toBeDefined();
      expect(result.OR).toHaveLength(3); // title, description, content
    });

    it('should build where clause with single tag', () => {
      const result = buildPostWhereClause({ tags: 'javascript' });
      
      expect(result.tags).toEqual({
        hasSome: ['javascript'],
      });
    });

    it('should build where clause with multiple tags', () => {
      const result = buildPostWhereClause({ tags: ['javascript', 'react'] });
      
      expect(result.tags).toEqual({
        hasSome: ['javascript', 'react'],
      });
    });

    it('should combine multiple filters', () => {
      const result = buildPostWhereClause({
        status: 'Published',
        topic: 'React',
        search: 'hooks',
        tags: ['react'],
      });
      
      expect(result.status).toBe('Published');
      expect(result.topic).toBe('react');
      expect(result.OR).toBeDefined();
      expect(result.tags).toBeDefined();
    });

    it('should handle empty filters', () => {
      const result = buildPostWhereClause({});
      
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('buildProjectWhereClause', () => {
    it('should build where clause with status filter', () => {
      const result = buildProjectWhereClause({ status: 'Published' });
      
      expect(result.status).toBe('Published');
    });

    it('should exclude status when "all" is specified', () => {
      const result = buildProjectWhereClause({ status: 'all' });
      
      expect(result.status).toBeUndefined();
    });

    it('should build where clause with search filter', () => {
      const result = buildProjectWhereClause({ search: 'test' });
      
      expect(result.OR).toBeDefined();
    });

    it('should build where clause with tags as string', () => {
      const result = buildProjectWhereClause({ tags: 'react' });
      
      expect(result.tags).toEqual({
        hasSome: ['react'],
      });
    });

    it('should build where clause with tags as array', () => {
      const result = buildProjectWhereClause({ tags: ['react', 'next'] });
      
      expect(result.tags).toEqual({
        hasSome: ['react', 'next'],
      });
    });

    it('should build where clause with featured filter', () => {
      const result = buildProjectWhereClause({ featured: true });
      
      expect(result.featured).toBe(true);
    });

    it('should handle featured: false', () => {
      const result = buildProjectWhereClause({ featured: false });
      
      expect(result.featured).toBe(false);
    });

    it('should not include featured when undefined', () => {
      const result = buildProjectWhereClause({});
      
      expect(result.featured).toBeUndefined();
    });
  });

  describe('buildPostIncludeClause', () => {
    it('should include counts by default', () => {
      const result = buildPostIncludeClause();
      
      expect(result._count).toBeDefined();
      expect(result._count.select.comments).toBe(true);
      expect(result._count.select.likes).toBe(true);
    });

    it('should include counts when true', () => {
      const result = buildPostIncludeClause(true);
      
      expect(result._count).toBeDefined();
    });

    it('should return empty object when false', () => {
      const result = buildPostIncludeClause(false);
      
      expect(result).toEqual({});
    });
  });

  describe('buildProjectIncludeClause', () => {
    it('should include team members by default', () => {
      const result = buildProjectIncludeClause();
      
      expect(result.teamMembers).toBe(true);
    });

    it('should include team members when true', () => {
      const result = buildProjectIncludeClause(true);
      
      expect(result.teamMembers).toBe(true);
    });

    it('should return empty object when false', () => {
      const result = buildProjectIncludeClause(false);
      
      expect(result).toEqual({});
    });
  });

  describe('buildPostQuery', () => {
    it('should build complete query with all options', () => {
      const result = buildPostQuery({
        where: { status: 'Published' },
        orderBy: { createdAt: 'desc' },
        limit: 10,
        offset: 20,
        includeCounts: true,
      });
      
      expect(result.where).toEqual({ status: 'Published' });
      expect(result.orderBy).toEqual({ createdAt: 'desc' });
      expect(result.take).toBe(10);
      expect(result.skip).toBe(20);
      expect(result.include._count).toBeDefined();
    });

    it('should exclude take when limit is undefined', () => {
      const result = buildPostQuery({
        where: {},
        orderBy: {},
      });
      
      expect(result.take).toBeUndefined();
    });

    it('should exclude skip when offset is 0 or undefined', () => {
      const result = buildPostQuery({
        where: {},
        orderBy: {},
        offset: 0,
      });
      
      expect(result.skip).toBeUndefined();
    });

    it('should include skip when offset is greater than 0', () => {
      const result = buildPostQuery({
        where: {},
        orderBy: {},
        offset: 5,
      });
      
      expect(result.skip).toBe(5);
    });

    it('should exclude counts when includeCounts is false', () => {
      const result = buildPostQuery({
        where: {},
        orderBy: {},
        includeCounts: false,
      });
      
      expect(result.include).toEqual({});
    });
  });

  describe('buildProjectQuery', () => {
    it('should build complete query with all options', () => {
      const result = buildProjectQuery({
        where: { featured: true },
        orderBy: { startDate: 'desc' },
        limit: 5,
        offset: 10,
        includeTeam: true,
      });
      
      expect(result.where).toEqual({ featured: true });
      expect(result.orderBy).toEqual({ startDate: 'desc' });
      expect(result.take).toBe(5);
      expect(result.skip).toBe(10);
      expect(result.include.teamMembers).toBe(true);
    });

    it('should exclude team when includeTeam is false', () => {
      const result = buildProjectQuery({
        where: {},
        orderBy: {},
        includeTeam: false,
      });
      
      expect(result.include).toEqual({});
    });

    it('should include team by default', () => {
      const result = buildProjectQuery({
        where: {},
        orderBy: {},
      });
      
      expect(result.include.teamMembers).toBe(true);
    });
  });
});

