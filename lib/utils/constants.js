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
  DRAFT: "Draft",
  PUBLISHED: "Published",
};

// Post type values
export const POST_TYPE = {
  ARTICLE: "Article",
  VIDEO: "Video",
};

// Sort options
export const SORT_OPTIONS = {
  DATE_PUBLISHED: "datePublished",
  CREATED_AT: "createdAt",
  TITLE: "title",
  VIEW_COUNT: "viewCount",
};

export const SORT_ORDER = {
  ASC: "asc",
  DESC: "desc",
};

// Performance constants
export const DEBOUNCE_DELAY_MS = 300;
export const INITIAL_PROJECT_DISPLAY_COUNT = 9;
export const PROJECTS_PER_PAGE = 9;

// Certification constants
export const CERTIFICATION_EXPIRING_SOON_DAYS = 90;

// Expertise/Progress constants
export const EXPERTISE_SCALE_MAX = 5;
export const DEFAULT_PROGRESS_PERCENTAGE = 60;

// Animation constants
export const ANIMATION_DELAY_BASE = 0.05; // Base delay for staggered animations
export const CONTACT_TYPED_DELAY_MS = 1500;
export const CONTENT_SHOW_DELAY_MS = 250;
