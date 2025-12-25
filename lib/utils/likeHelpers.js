/**
 * Helper functions for like functionality
 */

/**
 * Build like API URL
 */
export function buildLikeApiUrl(topic, slug) {
  return `/api/posts/${topic}/${slug}/like`;
}

