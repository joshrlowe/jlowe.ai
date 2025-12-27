/**
 * Data Fetching Utilities
 *
 * Following Martin Fowler's refactoring principles:
 * - Extract Method: Common data fetching patterns extracted
 * - Single Responsibility: Each function handles one fetching concern
 *
 * @module dataFetching
 */

/**
 * Safely extracts social media links from contact data
 *
 * @param {Object} contactData - Contact data object
 * @returns {Object} Social media links object
 */
export function extractSocialMediaLinks(contactData) {
  if (
    !contactData?.socialMediaLinks ||
    typeof contactData.socialMediaLinks !== "object"
  ) {
    return {};
  }
  return contactData.socialMediaLinks;
}

/**
 * Creates safe href for links (handles hydration)
 *
 * @param {boolean} mounted - Whether component is mounted
 * @param {string} url - URL to use
 * @returns {string} Safe href (empty string or url)
 */
export function createSafeHref(mounted, url) {
  return mounted && url ? url : "#";
}

/**
 * Handles link click to prevent navigation when href is "#"
 *
 * @param {Event} e - Click event
 * @param {string} href - Link href
 */
export function handleSafeLinkClick(e, href) {
  if (href === "#") {
    e.preventDefault();
  }
}
