/**
 * Data Fetching Utilities
 *
 * Common data fetching and link safety patterns.
 */

interface ContactData {
  socialMediaLinks?: Record<string, unknown> | null;
  [key: string]: unknown;
}

/**
 * Safely extracts social media links from contact data
 */
export function extractSocialMediaLinks(
  contactData: ContactData | null | undefined,
): Record<string, unknown> {
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
 */
export function createSafeHref(mounted: boolean, url: string): string {
  return mounted && url ? url : "#";
}

/**
 * Handles link click to prevent navigation when href is "#"
 */
export function handleSafeLinkClick(e: Event, href: string): void {
  if (href === "#") {
    e.preventDefault();
  }
}
