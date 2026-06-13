import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-config";

export const dynamic = "force-static";

// Prod-true rules. The dev distribution adds X-Robots-Tag: noindex at the
// CDN layer, so nothing environment-specific leaks into the app bundle.
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl().origin;
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
