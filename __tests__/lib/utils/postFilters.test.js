/**
 * Tests for postFilters utilities
 */
import {
  filterBySearch,
  filterByTopic,
  filterByTag,
  applyFilters,
  sortPosts,
  filterAndSortPosts,
  paginate,
  calculateTotalPages,
} from '@/lib/utils/postFilters';
import { SORT_OPTIONS, SORT_ORDER } from '@/lib/utils/constants';

describe('postFilters', () => {
  const mockPosts = [
    {
      id: '1',
      title: 'React Tutorial',
      description: 'Learn React basics',
      topic: 'web-development',
      tags: ['react', 'javascript'],
      datePublished: '2024-01-15',
      viewCount: 100,
    },
    {
      id: '2',
      title: 'Node.js Guide',
      description: 'Node.js best practices',
      topic: 'backend',
      tags: ['nodejs', 'javascript'],
      datePublished: '2024-01-10',
      viewCount: 200,
    },
    {
      id: '3',
      title: 'CSS Tips',
      description: 'CSS styling tricks',
      topic: 'web-development',
      tags: ['css', 'frontend'],
      datePublished: '2024-01-20',
      viewCount: 50,
    },
  ];

  describe('filterBySearch', () => {
    it('should filter by title', () => {
      const result = filterBySearch(mockPosts, 'React');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('React Tutorial');
    });

    it('should filter by description', () => {
      const result = filterBySearch(mockPosts, 'best practices');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Node.js Guide');
    });

    it('should filter by tags', () => {
      const result = filterBySearch(mockPosts, 'javascript');
      expect(result).toHaveLength(2);
    });

    it('should return all posts for empty query', () => {
      const result = filterBySearch(mockPosts, '');
      expect(result).toHaveLength(3);
    });

    it('should be case insensitive', () => {
      const result = filterBySearch(mockPosts, 'REACT');
      expect(result).toHaveLength(1);
    });

    it('should return empty array if no matches', () => {
      const result = filterBySearch(mockPosts, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('filterByTopic', () => {
    it('should filter by topic', () => {
      const result = filterByTopic(mockPosts, 'web-development');
      expect(result).toHaveLength(2);
    });

    it('should return all posts for "all"', () => {
      const result = filterByTopic(mockPosts, 'all');
      expect(result).toHaveLength(3);
    });

    it('should return all posts for empty topic', () => {
      const result = filterByTopic(mockPosts, '');
      expect(result).toHaveLength(3);
    });
  });

  describe('filterByTag', () => {
    it('should filter by tag', () => {
      const result = filterByTag(mockPosts, 'react');
      expect(result).toHaveLength(1);
    });

    it('should return all posts for "all"', () => {
      const result = filterByTag(mockPosts, 'all');
      expect(result).toHaveLength(3);
    });
  });

  describe('applyFilters', () => {
    it('should apply multiple filters', () => {
      const result = applyFilters(mockPosts, {
        searchQuery: 'javascript',
        topic: 'backend',
        tag: 'all',
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Node.js Guide');
    });

    it('should handle no filters', () => {
      const result = applyFilters(mockPosts, {
        searchQuery: '',
        topic: 'all',
        tag: 'all',
      });
      expect(result).toHaveLength(3);
    });
  });

  describe('sortPosts', () => {
    it('should sort by datePublished descending', () => {
      const result = sortPosts(mockPosts, SORT_OPTIONS.DATE_PUBLISHED, SORT_ORDER.DESC);
      expect(result[0].title).toBe('CSS Tips'); // Most recent
      expect(result[2].title).toBe('Node.js Guide'); // Oldest
    });

    it('should sort by datePublished ascending', () => {
      const result = sortPosts(mockPosts, SORT_OPTIONS.DATE_PUBLISHED, SORT_ORDER.ASC);
      expect(result[0].title).toBe('Node.js Guide'); // Oldest
      expect(result[2].title).toBe('CSS Tips'); // Most recent
    });

    it('should sort by title ascending', () => {
      const result = sortPosts(mockPosts, SORT_OPTIONS.TITLE, SORT_ORDER.ASC);
      expect(result[0].title).toBe('CSS Tips');
      expect(result[1].title).toBe('Node.js Guide');
      expect(result[2].title).toBe('React Tutorial');
    });

    it('should sort by viewCount descending', () => {
      const result = sortPosts(mockPosts, SORT_OPTIONS.VIEW_COUNT, SORT_ORDER.DESC);
      expect(result[0].viewCount).toBe(200);
      expect(result[2].viewCount).toBe(50);
    });

    it('should handle missing sort values', () => {
      const postsWithMissing = [
        { ...mockPosts[0], datePublished: null },
        { ...mockPosts[1] },
      ];
      const result = sortPosts(postsWithMissing, SORT_OPTIONS.DATE_PUBLISHED, SORT_ORDER.DESC);
      expect(result).toHaveLength(2);
    });
  });

  describe('filterAndSortPosts', () => {
    it('should filter and sort', () => {
      const result = filterAndSortPosts(mockPosts, {
        searchQuery: 'javascript',
        topic: 'all',
        tag: 'all',
        sortBy: SORT_OPTIONS.DATE_PUBLISHED,
        sortOrder: SORT_ORDER.DESC,
      });
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('React Tutorial');
    });
  });

  describe('paginate', () => {
    it('should return first page', () => {
      const result = paginate(mockPosts, 1, 2);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
    });

    it('should return second page', () => {
      const result = paginate(mockPosts, 2, 2);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('should handle page beyond available items', () => {
      const result = paginate(mockPosts, 10, 2);
      expect(result).toHaveLength(0);
    });
  });

  describe('calculateTotalPages', () => {
    it('should calculate total pages', () => {
      expect(calculateTotalPages(10, 3)).toBe(4);
      expect(calculateTotalPages(12, 3)).toBe(4);
      expect(calculateTotalPages(9, 3)).toBe(3);
    });

    it('should return 1 for empty array', () => {
      expect(calculateTotalPages(0, 10)).toBe(0);
    });
  });
});

