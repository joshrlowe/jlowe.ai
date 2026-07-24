/**
 * Post filtering and sorting utilities
 *
 * Extracted from ArticlesPage component to improve testability and reusability
 */
import { SORT_OPTIONS, SORT_ORDER } from "./constants";

interface PostItem {
  title?: string;
  description?: string;
  tags?: string[];
  topic?: string;
  datePublished?: string | null;
  createdAt?: string;
  viewCount?: number;
  [key: string]: unknown;
}

interface FilterOptions {
  searchQuery?: string;
  topic?: string;
  tag?: string;
}

interface FilterAndSortOptions extends FilterOptions {
  sortBy?: string;
  sortOrder?: string;
}

/**
 * Filter posts by search query
 */
export function filterBySearch(posts: PostItem[], searchQuery: string): PostItem[] {
  if (!searchQuery) return posts;

  const query = searchQuery.toLowerCase();
  return posts.filter(
    (post) =>
      post.title?.toLowerCase().includes(query) ||
      post.description?.toLowerCase().includes(query) ||
      post.tags?.some((tag) => tag.toLowerCase().includes(query))
  );
}

/**
 * Filter posts by topic
 */
export function filterByTopic(posts: PostItem[], topic: string): PostItem[] {
  if (!topic || topic === "all") return posts;
  return posts.filter((post) => post.topic === topic);
}

/**
 * Filter posts by tag
 */
export function filterByTag(posts: PostItem[], tag: string): PostItem[] {
  if (!tag || tag === "all") return posts;
  return posts.filter((post) => post.tags?.includes(tag));
}

/**
 * Apply all filters to posts
 */
export function applyFilters(
  posts: PostItem[],
  { searchQuery, topic, tag }: FilterOptions
): PostItem[] {
  let filtered = [...posts];
  if (searchQuery) filtered = filterBySearch(filtered, searchQuery);
  if (topic) filtered = filterByTopic(filtered, topic);
  if (tag) filtered = filterByTag(filtered, tag);
  return filtered;
}

/**
 * Get sort value for a post based on sort field
 */
function getSortValue(post: PostItem, sortBy: string): number | string {
  const value = post[sortBy];

  if (sortBy === SORT_OPTIONS.DATE_PUBLISHED || sortBy === SORT_OPTIONS.CREATED_AT) {
    return value ? new Date(value as string).getTime() : 0;
  }

  if (typeof value === "string") {
    return value.toLowerCase();
  }

  return (value as number) || 0;
}

/**
 * Sort posts
 */
export function sortPosts(
  posts: PostItem[],
  sortBy: string = SORT_OPTIONS.DATE_PUBLISHED,
  sortOrder: string = SORT_ORDER.DESC
): PostItem[] {
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
 */
export function filterAndSortPosts(posts: PostItem[], options: FilterAndSortOptions): PostItem[] {
  const { searchQuery, topic, tag, sortBy, sortOrder } = options;
  const filtered = applyFilters(posts, { searchQuery, topic, tag });
  return sortPosts(filtered, sortBy, sortOrder);
}

/**
 * Paginate an array
 */
export function paginate<T>(items: T[], page: number, itemsPerPage: number): T[] {
  const startIndex = (page - 1) * itemsPerPage;
  return items.slice(startIndex, startIndex + itemsPerPage);
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(totalItems: number, itemsPerPage: number): number {
  return Math.ceil(totalItems / itemsPerPage);
}
