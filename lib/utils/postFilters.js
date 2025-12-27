/**
 * Post filtering and sorting utilities
 *
 * Extracted from ArticlesPage component to improve testability and reusability
 * (Refactoring: Extract Method)
 */
import { SORT_OPTIONS, SORT_ORDER } from "./constants.js";

/**
 * Filter posts by search query
 * @param {Array} posts - Array of post objects
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered posts
 */
export function filterBySearch(posts, searchQuery) {
  if (!searchQuery) return posts;

  const query = searchQuery.toLowerCase();
  return posts.filter(
    (post) =>
      post.title?.toLowerCase().includes(query) ||
      post.description?.toLowerCase().includes(query) ||
      post.tags?.some((tag) => tag.toLowerCase().includes(query)),
  );
}

/**
 * Filter posts by topic
 * @param {Array} posts - Array of post objects
 * @param {string} topic - Topic to filter by (or 'all' for no filter)
 * @returns {Array} Filtered posts
 */
export function filterByTopic(posts, topic) {
  if (!topic || topic === "all") return posts;
  return posts.filter((post) => post.topic === topic);
}

/**
 * Filter posts by tag
 * @param {Array} posts - Array of post objects
 * @param {string} tag - Tag to filter by (or 'all' for no filter)
 * @returns {Array} Filtered posts
 */
export function filterByTag(posts, tag) {
  if (!tag || tag === "all") return posts;
  return posts.filter((post) => post.tags?.includes(tag));
}

/**
 * Apply all filters to posts
 * @param {Array} posts - Array of post objects
 * @param {Object} filters - Filter options
 * @param {string} filters.searchQuery - Search query
 * @param {string} filters.topic - Topic filter
 * @param {string} filters.tag - Tag filter
 * @returns {Array} Filtered posts
 */
export function applyFilters(posts, { searchQuery, topic, tag }) {
  let filtered = [...posts];
  filtered = filterBySearch(filtered, searchQuery);
  filtered = filterByTopic(filtered, topic);
  filtered = filterByTag(filtered, tag);
  return filtered;
}

/**
 * Get sort value for a post based on sort field
 * @private
 */
function getSortValue(post, sortBy) {
  const value = post[sortBy];

  if (
    sortBy === SORT_OPTIONS.DATE_PUBLISHED ||
    sortBy === SORT_OPTIONS.CREATED_AT
  ) {
    return value ? new Date(value).getTime() : 0;
  }

  if (typeof value === "string") {
    return value.toLowerCase();
  }

  return value || 0;
}

/**
 * Sort posts
 * @param {Array} posts - Array of post objects
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted posts
 */
export function sortPosts(
  posts,
  sortBy = SORT_OPTIONS.DATE_PUBLISHED,
  sortOrder = SORT_ORDER.DESC,
) {
  const sorted = [...posts];

  sorted.sort((a, b) => {
    const aVal = getSortValue(a, sortBy);
    const bVal = getSortValue(b, sortBy);

    if (sortOrder === SORT_ORDER.ASC) {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  return sorted;
}

/**
 * Apply filters and sorting to posts
 * @param {Array} posts - Array of post objects
 * @param {Object} options - Filter and sort options
 * @returns {Array} Filtered and sorted posts
 */
export function filterAndSortPosts(posts, options) {
  const { searchQuery, topic, tag, sortBy, sortOrder } = options;
  const filtered = applyFilters(posts, { searchQuery, topic, tag });
  return sortPosts(filtered, sortBy, sortOrder);
}

/**
 * Paginate an array
 * @param {Array} items - Array to paginate
 * @param {number} page - Current page (1-indexed)
 * @param {number} itemsPerPage - Number of items per page
 * @returns {Array} Paginated items
 */
export function paginate(items, page, itemsPerPage) {
  const startIndex = (page - 1) * itemsPerPage;
  return items.slice(startIndex, startIndex + itemsPerPage);
}

/**
 * Calculate total pages
 * @param {number} totalItems - Total number of items
 * @param {number} itemsPerPage - Number of items per page
 * @returns {number} Total number of pages
 */
export function calculateTotalPages(totalItems, itemsPerPage) {
  return Math.ceil(totalItems / itemsPerPage);
}
