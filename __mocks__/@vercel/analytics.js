/**
 * Mock for @vercel/analytics
 *
 * Used for testing analytics functionality without making actual API calls.
 */

export const track = jest.fn();

export default {
  track,
};
