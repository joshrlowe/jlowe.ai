/**
 * Constants used throughout the application
 *
 * Extracted from magic numbers to improve readability and maintainability
 */

// Reading time calculation
export const WORDS_PER_MINUTE = 225;
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
export const ANIMATION = {
  // Timing
  DELAY_BASE: 0.05,           // Base delay for staggered animations
  DURATION_FAST: 0.3,         // Fast transitions
  DURATION_NORMAL: 0.5,       // Normal transitions
  DURATION_SLOW: 0.8,         // Slow/dramatic transitions
  DURATION_VERY_SLOW: 1.2,    // Very slow transitions

  // Delays (milliseconds)
  CONTACT_TYPED_DELAY_MS: 1500,
  CONTENT_SHOW_DELAY_MS: 250,
  INTRO_ANIMATION_DELAY_MS: 3300,  // Wait for intro to complete

  // GSAP easing
  EASE_DEFAULT: "power2.out",
  EASE_SMOOTH: "power3.out",
  EASE_BOUNCE: "back.out(1.7)",

  // Scroll trigger defaults
  SCROLL_START: "top 85%",
  SCROLL_ACTIONS: "play none none reverse",

  // Stagger delays
  STAGGER_CARDS: 0.1,
  STAGGER_ITEMS: 0.07,
  STAGGER_FAST: 0.05,
};

// Deprecated: keeping for backward compatibility
export const ANIMATION_DELAY_BASE = ANIMATION.DELAY_BASE;
export const CONTACT_TYPED_DELAY_MS = ANIMATION.CONTACT_TYPED_DELAY_MS;
export const CONTENT_SHOW_DELAY_MS = ANIMATION.CONTENT_SHOW_DELAY_MS;

// SUPERNOVA Theme Colors - Unified color palette
export const THEME_COLORS = {
  // Primary ember palette
  ember: {
    primary: "#E85D04",
    secondary: "#C04A03",
    light: "#F48C06",
    dark: "#9D0208",
  },
  // Accent colors
  accent: {
    gold: "#FAA307",
    cool: "#4CC9F0",
    fuchsia: "#F72585",
    nebula: "#4895EF",
  },
  // Status colors
  status: {
    success: "#10B981",
    warning: "#FAA307",
    error: "#EF4444",
    info: "#4CC9F0",
    neutral: "#A3A3A3",
  },
};

// Color map for component styling (bg, border, text, glow)
export const COLOR_VARIANTS = {
  primary: {
    text: "#E85D04",
    bg: "rgba(232, 93, 4, 0.12)",
    border: "rgba(232, 93, 4, 0.25)",
    glow: "0 0 25px rgba(232, 93, 4, 0.35)",
  },
  secondary: {
    text: "#9D0208",
    bg: "rgba(157, 2, 8, 0.12)",
    border: "rgba(157, 2, 8, 0.25)",
    glow: "0 0 25px rgba(157, 2, 8, 0.35)",
  },
  accent: {
    text: "#FAA307",
    bg: "rgba(250, 163, 7, 0.12)",
    border: "rgba(250, 163, 7, 0.25)",
    glow: "0 0 25px rgba(250, 163, 7, 0.35)",
  },
  cool: {
    text: "#4CC9F0",
    bg: "rgba(76, 201, 240, 0.12)",
    border: "rgba(76, 201, 240, 0.25)",
    glow: "0 0 25px rgba(76, 201, 240, 0.35)",
  },
  fuchsia: {
    text: "#F72585",
    bg: "rgba(247, 37, 133, 0.12)",
    border: "rgba(247, 37, 133, 0.25)",
    glow: "0 0 25px rgba(247, 37, 133, 0.35)",
  },
  success: {
    text: "#10B981",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.25)",
    glow: "0 0 25px rgba(16, 185, 129, 0.35)",
  },
  warning: {
    text: "#FAA307",
    bg: "rgba(250, 163, 7, 0.12)",
    border: "rgba(250, 163, 7, 0.25)",
    glow: "0 0 25px rgba(250, 163, 7, 0.35)",
  },
  error: {
    text: "#EF4444",
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.25)",
    glow: "0 0 25px rgba(239, 68, 68, 0.35)",
  },
  info: {
    text: "#4CC9F0",
    bg: "rgba(76, 201, 240, 0.12)",
    border: "rgba(76, 201, 240, 0.25)",
    glow: "0 0 25px rgba(76, 201, 240, 0.35)",
  },
  neutral: {
    text: "#A3A3A3",
    bg: "rgba(163, 163, 163, 0.12)",
    border: "rgba(163, 163, 163, 0.25)",
    glow: "0 0 25px rgba(163, 163, 163, 0.35)",
  },
};

// Featured project accent colors (cycling)
export const FEATURED_ACCENT_COLORS = [
  COLOR_VARIANTS.primary,
  COLOR_VARIANTS.cool,
  COLOR_VARIANTS.accent,
  COLOR_VARIANTS.fuchsia,
];
