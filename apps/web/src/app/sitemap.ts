import type { MetadataRoute } from "next";

import { entriesByKind } from "@/lib/corpus";
import { siteUrl } from "@/lib/site-config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl().origin;
  // /world is intentionally excluded: the (world) layout marks it
  // `robots: { index: false }` until the 3D experience ships, and listing a
  // noindexed URL in the sitemap sends search engines a contradictory signal.
  // Re-add it here when the noindex is lifted.
  const routes = [
    "/",
    "/about/",
    "/projects/",
    "/articles/",
    "/contact/",
    // Corpus-driven detail routes (one per public project/article entry).
    ...entriesByKind("project").map((entry) => `/projects/${entry.slug}/`),
    ...entriesByKind("article").map((entry) => `/articles/${entry.slug}/`),
  ];
  return routes.map((route) => ({
    url: `${base}${route}`,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
