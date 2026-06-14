import { z } from "zod";

/**
 * Frontmatter contract for every corpus entry. Shared by the world's
 * build-corpus generator (Phase 2) and — later — Phase-5 RAG ingestion, so the
 * corpus stays the single source of truth. zod parsing fails the build on a
 * malformed entry or an accidental `visibility: private` leak.
 */
export const CorpusFrontmatter = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
    title: z.string().min(1),
    kind: z.enum(["project", "article", "faq"]),
    role: z.string().min(1).optional(),
    stack: z.array(z.string().min(1)).optional(),
    outcomes: z.array(z.string().min(1)).optional(),
    visibility: z.enum(["public", "private"]),
  })
  .strict();
