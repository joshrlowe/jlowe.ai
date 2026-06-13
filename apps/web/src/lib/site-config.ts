export const SITE_NAME = "Josh Lowe";
export const SITE_TAGLINE = "AI Engineer & Consultant";

/**
 * Canonical site origin for metadata, sitemap, and robots.
 * Injected at build time per environment (dev.jlowe.ai vs jlowe.ai).
 */
export function siteUrl(): URL {
  // `||` (not `??`): an empty build arg must fall back, not throw on new URL("").
  return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://jlowe.ai");
}
