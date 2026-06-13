import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl().origin;
  const routes = [
    "/",
    "/about/",
    "/projects/",
    "/articles/",
    "/contact/",
    "/world/",
  ];
  return routes.map((route) => ({
    url: `${base}${route}`,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
