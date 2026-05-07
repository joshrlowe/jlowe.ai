/**
 * Helper functions for like functionality
 */

/**
 * Build like API URL
 */
export function buildLikeApiUrl(topic: string, slug: string): string {
  return `/api/posts/${topic}/${slug}/like`;
}
