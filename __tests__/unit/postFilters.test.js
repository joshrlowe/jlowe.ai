/**
 * Tests for postFilters utility
 * 
 * Tests post filtering, sorting, and pagination functions.
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

describe('postFilters', () => {
  const mockPosts = [
    {
      id: '1',
      title: 'React Hooks Guide',
      description: 'Learn about React hooks',
      topic: 'react',
      tags: ['react', 'javascript', 'hooks'],
      datePublished: '2024-01-15T00:00:00Z',
      createdAt: '2024-01-10T00:00:00Z',
      viewCount: 100,
    },
    {
      id: '2',
      title: 'Python Machine Learning',
      description: 'ML with Python',
      topic: 'python',
      tags: ['python', 'ml', 'ai'],
      datePublished: '2024-02-01T00:00:00Z',
      createdAt: '2024-01-20T00:00:00Z',
      viewCount: 250,
    },
    {
      id: '3',
      title: 'JavaScript Basics',
      description: 'Getting started with JS',
      topic: 'javascript',
      tags: ['javascript', 'beginner'],
      datePublished: '2024-01-20T00:00:00Z',
      createdAt: '2024-01-05T00:00:00Z',
      viewCount: 50,
    },
  ];

  describe('filterBySearch', () => {
    it('should filter posts by title match', () => {
      const result = filterBySearch(mockPosts, 'React');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter posts by description match', () => {
      const result = filterBySearch(mockPosts, 'ML with');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter posts by tag match', () => {
      const result = filterBySearch(mockPosts, 'hooks');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should be case-insensitive', () => {
      const result = filterBySearch(mockPosts, 'JAVASCRIPT');
      
      expect(result).toHaveLength(2); // React post has js tag, JS Basics
    });

    it('should return all posts for empty search', () => {
      expect(filterBySearch(mockPosts, '')).toHaveLength(3);
      expect(filterBySearch(mockPosts, null)).toHaveLength(3);
      expect(filterBySearch(mockPosts, undefined)).toHaveLength(3);
    });

    it('should return empty array for no matches', () => {
      const result = filterBySearch(mockPosts, 'nonexistent');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('filterByTopic', () => {
    it('should filter posts by topic', () => {
      const result = filterByTopic(mockPosts, 'react');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should return all posts for "all" topic', () => {
      expect(filterByTopic(mockPosts, 'all')).toHaveLength(3);
    });

    it('should return all posts for empty topic', () => {
      expect(filterByTopic(mockPosts, '')).toHaveLength(3);
      expect(filterByTopic(mockPosts, null)).toHaveLength(3);
      expect(filterByTopic(mockPosts, undefined)).toHaveLength(3);
    });
  });

  describe('filterByTag', () => {
    it('should filter posts by tag', () => {
      const result = filterByTag(mockPosts, 'python');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should return all posts for "all" tag', () => {
      expect(filterByTag(mockPosts, 'all')).toHaveLength(3);
    });

    it('should return all posts for empty tag', () => {
      expect(filterByTag(mockPosts, '')).toHaveLength(3);
      expect(filterByTag(mockPosts, null)).toHaveLength(3);
    });

    it('should handle posts without tags', () => {
      const postsWithoutTags = [{ id: '1', title: 'No Tags' }];
      const result = filterByTag(postsWithoutTags, 'react');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('applyFilters', () => {
    it('should apply all filters', () => {
      const result = applyFilters(mockPosts, {
        searchQuery: 'javascript',
        topic: 'react',
        tag: 'hooks',
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should work with partial filters', () => {
      const result = applyFilters(mockPosts, {
        searchQuery: '',
        topic: 'python',
        tag: 'all',
      });
      
      expect(result).toHaveLength(1);
    });
  });

  describe('sortPosts', () => {
    it('should sort by datePublished descending by default', () => {
      const result = sortPosts(mockPosts);
      
      expect(result[0].id).toBe('2'); // Feb 2024
      expect(result[1].id).toBe('3'); // Jan 20
      expect(result[2].id).toBe('1'); // Jan 15
    });

    it('should handle numeric sort values', () => {
      const postsWithNumbers = [
        { id: '1', priority: 3 },
        { id: '2', priority: 1 },
        { id: '3', priority: 2 },
      ];
      
      const result = sortPosts(postsWithNumbers, 'priority', 'asc');
      
      expect(result[0].priority).toBe(1);
      expect(result[1].priority).toBe(2);
      expect(result[2].priority).toBe(3);
    });

    it('should handle undefined sort values with fallback to 0', () => {
      const postsWithMissing = [
        { id: '1', priority: 2 },
        { id: '2', priority: undefined },
        { id: '3', priority: 1 },
      ];
      
      const result = sortPosts(postsWithMissing, 'priority', 'asc');
      
      // undefined becomes 0, so it should come first
      expect(result[0].id).toBe('2');
    });

    it('should sort by datePublished ascending', () => {
      const result = sortPosts(mockPosts, 'datePublished', 'asc');
      
      expect(result[0].id).toBe('1'); // Jan 15
      expect(result[2].id).toBe('2'); // Feb 2024
    });

    it('should sort by title ascending', () => {
      const result = sortPosts(mockPosts, 'title', 'asc');
      
      expect(result[0].title).toBe('JavaScript Basics');
      expect(result[1].title).toBe('Python Machine Learning');
      expect(result[2].title).toBe('React Hooks Guide');
    });

    it('should sort by viewCount descending', () => {
      const result = sortPosts(mockPosts, 'viewCount', 'desc');
      
      expect(result[0].viewCount).toBe(250);
      expect(result[1].viewCount).toBe(100);
      expect(result[2].viewCount).toBe(50);
    });

    it('should not modify original array', () => {
      const original = [...mockPosts];
      sortPosts(mockPosts, 'title', 'asc');
      
      expect(mockPosts[0].id).toBe(original[0].id);
    });

    it('should handle null date values', () => {
      const postsWithNullDate = [
        { id: '1', datePublished: null },
        { id: '2', datePublished: '2024-01-01' },
      ];
      
      const result = sortPosts(postsWithNullDate, 'datePublished', 'desc');
      
      expect(result[0].id).toBe('2');
    });
  });

  describe('filterAndSortPosts', () => {
    it('should apply filters and sorting together', () => {
      const result = filterAndSortPosts(mockPosts, {
        searchQuery: '',
        topic: 'all',
        tag: 'javascript',
        sortBy: 'title',
        sortOrder: 'asc',
      });
      
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('JavaScript Basics');
      expect(result[1].title).toBe('React Hooks Guide');
    });
  });

  describe('paginate', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it('should return correct items for first page', () => {
      const result = paginate(items, 1, 3);
      
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return correct items for second page', () => {
      const result = paginate(items, 2, 3);
      
      expect(result).toEqual([4, 5, 6]);
    });

    it('should return remaining items for last page', () => {
      const result = paginate(items, 4, 3);
      
      expect(result).toEqual([10]);
    });

    it('should return empty array for page beyond items', () => {
      const result = paginate(items, 5, 3);
      
      expect(result).toEqual([]);
    });

    it('should return all items when itemsPerPage exceeds total', () => {
      const result = paginate(items, 1, 20);
      
      expect(result).toEqual(items);
    });
  });

  describe('calculateTotalPages', () => {
    it('should calculate correct number of pages', () => {
      expect(calculateTotalPages(10, 3)).toBe(4);
      expect(calculateTotalPages(9, 3)).toBe(3);
      expect(calculateTotalPages(1, 10)).toBe(1);
    });

    it('should handle zero items', () => {
      expect(calculateTotalPages(0, 10)).toBe(0);
    });

    it('should handle exact division', () => {
      expect(calculateTotalPages(12, 4)).toBe(3);
    });
  });
});

