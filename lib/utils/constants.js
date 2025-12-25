/**
 * Constants used throughout the application
 * 
 * Extracted from magic numbers to improve readability and maintainability
 */

// Reading time calculation
export const WORDS_PER_MINUTE = 200;
export const MIN_READING_TIME_MINUTES = 1;

// Pagination defaults
export const POSTS_PER_PAGE = 12;
export const PLAYLISTS_PER_PAGE = 9;

// Post status values
export const POST_STATUS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
};

// Post type values
export const POST_TYPE = {
  ARTICLE: 'Article',
  VIDEO: 'Video',
};

// Sort options
export const SORT_OPTIONS = {
  DATE_PUBLISHED: 'datePublished',
  CREATED_AT: 'createdAt',
  TITLE: 'title',
  VIEW_COUNT: 'viewCount',
};

export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
};

