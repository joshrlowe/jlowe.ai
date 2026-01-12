/**
 * Tests for apiHelpers utility
 * 
 * Tests common API helper functions for pagination, sorting, filtering.
 */

import {
  parsePagination,
  parseSort,
  buildOrderBy,
  buildSearchFilter,
  removeUndefined,
  validateRequiredFields,
  formatPaginatedResponse,
} from '@/lib/utils/apiHelpers';

describe('apiHelpers', () => {
  describe('parsePagination', () => {
    it('should parse limit and offset from query', () => {
      const result = parsePagination({ limit: '10', offset: '20' });
      expect(result).toEqual({ limit: 10, offset: 20 });
    });

    it('should return undefined limit when not provided', () => {
      const result = parsePagination({ offset: '10' });
      expect(result.limit).toBeUndefined();
      expect(result.offset).toBe(10);
    });

    it('should default offset to 0 when not provided', () => {
      const result = parsePagination({});
      expect(result.offset).toBe(0);
    });

    it('should handle empty query object', () => {
      const result = parsePagination({});
      expect(result).toEqual({ limit: undefined, offset: 0 });
    });

    it('should handle string "0" correctly', () => {
      const result = parsePagination({ limit: '0', offset: '0' });
      expect(result.limit).toBe(0);
      expect(result.offset).toBe(0);
    });
  });

  describe('parseSort', () => {
    it('should parse sort parameters from query', () => {
      const result = parseSort({ sortBy: 'title', sortOrder: 'asc' });
      expect(result).toEqual({ sortBy: 'title', sortOrder: 'asc' });
    });

    it('should use default values when not provided', () => {
      const result = parseSort({});
      expect(result).toEqual({ sortBy: 'createdAt', sortOrder: 'desc' });
    });

    it('should use custom defaults', () => {
      const result = parseSort({}, 'datePublished', 'asc');
      expect(result).toEqual({ sortBy: 'datePublished', sortOrder: 'asc' });
    });

    it('should override only sortBy when sortOrder not provided', () => {
      const result = parseSort({ sortBy: 'title' }, 'createdAt', 'desc');
      expect(result).toEqual({ sortBy: 'title', sortOrder: 'desc' });
    });
  });

  describe('buildOrderBy', () => {
    it('should build orderBy object', () => {
      const result = buildOrderBy('title', 'asc');
      expect(result).toEqual({ title: 'asc' });
    });

    it('should use field mapping', () => {
      const fieldMap = { date: 'createdAt', name: 'title' };
      const result = buildOrderBy('date', 'desc', fieldMap);
      expect(result).toEqual({ createdAt: 'desc' });
    });

    it('should fall back to sortBy when not in fieldMap', () => {
      const fieldMap = { date: 'createdAt' };
      const result = buildOrderBy('title', 'asc', fieldMap);
      expect(result).toEqual({ title: 'asc' });
    });

    it('should handle empty fieldMap', () => {
      const result = buildOrderBy('title', 'desc', {});
      expect(result).toEqual({ title: 'desc' });
    });
  });

  describe('buildSearchFilter', () => {
    it('should build search filter for multiple fields', () => {
      const result = buildSearchFilter('test', ['title', 'description']);
      
      expect(result.OR).toHaveLength(2);
      expect(result.OR[0]).toEqual({
        title: { contains: 'test', mode: 'insensitive' },
      });
      expect(result.OR[1]).toEqual({
        description: { contains: 'test', mode: 'insensitive' },
      });
    });

    it('should return empty object for empty search', () => {
      expect(buildSearchFilter('')).toEqual({});
      expect(buildSearchFilter(null)).toEqual({});
      expect(buildSearchFilter(undefined)).toEqual({});
    });

    it('should use default fields', () => {
      const result = buildSearchFilter('test');
      expect(result.OR).toHaveLength(2);
    });

    it('should handle single field', () => {
      const result = buildSearchFilter('test', ['title']);
      expect(result.OR).toHaveLength(1);
    });
  });

  describe('removeUndefined', () => {
    it('should remove undefined values from object', () => {
      const obj = { a: 1, b: undefined, c: 'test', d: undefined };
      const result = removeUndefined(obj);
      
      expect(result).toEqual({ a: 1, c: 'test' });
    });

    it('should keep null values', () => {
      const obj = { a: 1, b: null };
      const result = removeUndefined(obj);
      
      expect(result).toEqual({ a: 1, b: null });
    });

    it('should keep falsy values that are not undefined', () => {
      const obj = { a: 0, b: '', c: false, d: null };
      const result = removeUndefined(obj);
      
      expect(result).toEqual({ a: 0, b: '', c: false, d: null });
    });

    it('should handle empty object', () => {
      expect(removeUndefined({})).toEqual({});
    });

    it('should not modify original object', () => {
      const obj = { a: 1, b: undefined };
      removeUndefined(obj);
      
      expect(obj.b).toBeUndefined();
    });
  });

  describe('validateRequiredFields', () => {
    it('should return valid for all required fields present', () => {
      const body = { name: 'Test', email: 'test@example.com' };
      const result = validateRequiredFields(body, ['name', 'email']);
      
      expect(result.isValid).toBe(true);
    });

    it('should return invalid with missing fields message', () => {
      const body = { name: 'Test' };
      const result = validateRequiredFields(body, ['name', 'email', 'phone']);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('email');
      expect(result.message).toContain('phone');
    });

    it('should handle empty required fields', () => {
      const result = validateRequiredFields({}, []);
      expect(result.isValid).toBe(true);
    });

    it('should treat falsy values as missing', () => {
      const body = { name: '', email: null };
      const result = validateRequiredFields(body, ['name', 'email']);
      
      expect(result.isValid).toBe(false);
    });
  });

  describe('formatPaginatedResponse', () => {
    it('should format paginated response with data array', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = formatPaginatedResponse(data, 10, 2, 0);
      
      expect(result.total).toBe(10);
      expect(result.limit).toBe(2);
      expect(result.offset).toBe(0);
    });

    it('should auto-detect "posts" key for post-like data', () => {
      const data = [{ id: 1, title: 'Post' }];
      const result = formatPaginatedResponse(data, 5, 10, 0);
      
      expect(result.posts).toBeDefined();
    });

    it('should auto-detect "playlists" key for playlist data', () => {
      const data = [{ id: 1, playlistPosts: [] }];
      const result = formatPaginatedResponse(data, 5, 10, 0);
      
      expect(result.playlists).toBeDefined();
    });

    it('should use custom dataKey when provided', () => {
      const data = [{ id: 1 }];
      const result = formatPaginatedResponse(data, 5, 10, 0, 'projects');
      
      expect(result.projects).toBeDefined();
      expect(result.projects).toEqual(data);
    });

    it('should use "items" for empty array', () => {
      const result = formatPaginatedResponse([], 0, 10, 0);
      
      expect(result.items).toEqual([]);
    });

    it('should use data length as limit when limit is undefined', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = formatPaginatedResponse(data, 10, undefined, 0, 'items');
      
      expect(result.limit).toBe(3);
    });
  });
});



