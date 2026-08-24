/**
 * next-sitemap config — runs as a postbuild step (see package.json#scripts.postbuild).
 *
 * Generates public/sitemap.xml and public/robots.txt. Dynamic Post and Project
 * slugs are pulled from Prisma at build time so they reflect what
 * pages/articles/[topic]/[slug].tsx and pages/projects/[slug].tsx will
 * actually serve.
 *
 * This file is shared across hosts (canonical https://jlowe.ai and the leftover
 * jlowe-ai.vercel.app deployment). Host-specific crawler control lives in
 * vercel.json as an X-Robots-Tag header — changing robots.txt here would also
 * noindex the apex. robotsTxtOptions.additionalSitemaps is intentionally
 * unchanged.
 */

/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: "https://jlowe.ai",
  host: "https://jlowe.ai",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
  // Globs don't cover the bare segment itself, so /admin and /design are
  // listed alongside their /* variants.
  exclude: [
    "/admin",
    "/admin/*",
    "/api/*",
    "/design",
    "/design/*",
    "/articles/new",
    "/articles/[topic]/[slug]/preview",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/design", "/articles/new"],
      },
    ],
  },
  // Per-route priority overrides
  transform: async (cfg, path) => {
    const overrides = {
      "/": { priority: 1.0, changefreq: "weekly" },
      "/about": { priority: 0.9, changefreq: "monthly" },
      "/projects": { priority: 0.9, changefreq: "weekly" },
      "/articles": { priority: 0.9, changefreq: "weekly" },
      "/contact": { priority: 0.8, changefreq: "monthly" },
    };
    const override = overrides[path] || {};
    return {
      loc: path,
      changefreq: override.changefreq || cfg.changefreq,
      priority: override.priority ?? cfg.priority,
      lastmod: new Date().toISOString(),
      alternateRefs: cfg.alternateRefs ?? [],
    };
  },
  // Dynamic article + project slugs from Prisma
  additionalPaths: async () => {
    // Lazy-load Prisma to avoid pulling it into next-sitemap's own cold-start
    // when the build server doesn't have DATABASE_URL configured.
    if (!process.env.DATABASE_URL && !process.env.PRISMA_DATABASE_URL) {
      console.warn(
        "[next-sitemap] No DATABASE_URL set — emitting static routes only. " +
          "Dynamic /articles/[topic]/[slug] and /projects/[slug] entries will be missing."
      );
      return [];
    }
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    try {
      const [posts, projects] = await Promise.all([
        prisma.post.findMany({
          where: { status: "Published" },
          select: { slug: true, topic: true, updatedAt: true },
        }),
        prisma.project.findMany({
          where: { status: { not: "Draft" } },
          select: { slug: true, id: true, updatedAt: true },
        }),
      ]);
      const articlePaths = posts
        .filter((p) => p.slug && p.topic)
        .map((p) => ({
          loc: `/articles/${p.topic}/${p.slug}`,
          changefreq: "monthly",
          priority: 0.8,
          lastmod: p.updatedAt.toISOString(),
        }));
      const projectPaths = projects
        .filter((p) => p.slug || p.id)
        .map((p) => ({
          loc: `/projects/${p.slug || p.id}`,
          changefreq: "monthly",
          priority: 0.8,
          lastmod: p.updatedAt.toISOString(),
        }));
      return [...articlePaths, ...projectPaths];
    } finally {
      await prisma.$disconnect();
    }
  },
};

module.exports = config;
