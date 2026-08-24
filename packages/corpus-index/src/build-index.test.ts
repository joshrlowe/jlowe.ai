import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildIndex, hashesFromDocs, loadPublicCorpus } from "./build-index.js";
import { FRESHNESS_HINT, checkFreshness } from "./freshness.js";
import { CORPUS_INDEX } from "./index.generated.js";

const repoRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
);

describe("loadPublicCorpus", () => {
  it("includes public projects and excludes private draft articles", () => {
    const docs = loadPublicCorpus(repoRoot);
    const slugs = docs.map((d) => d.slug);
    expect(slugs).toContain("jarvis");
    expect(slugs).not.toContain("fail-open-llm-moderation");
    expect(slugs).not.toContain("progressive-enhancement-for-3d-sites");
    expect(docs.every((d) => d.body.length > 0)).toBe(true);
  });
});

describe("buildIndex", () => {
  it("emits a chunk for every public doc, including short FAQs", () => {
    const index = buildIndex(repoRoot);
    expect(index.version).toBe(1);
    expect(index.chunks.length).toBeGreaterThan(0);
    expect(index.bm25.n).toBe(index.chunks.length);
    const slugs = new Set(index.chunks.map((c) => c.sourceSlug));
    expect(slugs.has("about")).toBe(true);
    expect(slugs.has("fail-open-llm-moderation")).toBe(false);
    for (const chunk of index.chunks) {
      expect(chunk.contentHash).toMatch(/^[a-f0-9]{64}$/);
      expect(chunk.docLength).toBeGreaterThan(0);
      expect(chunk.id).toMatch(/^(project|article|faq):[a-z0-9-]+:\d+$/);
    }
  });
});

describe("checkFreshness", () => {
  it("passes when committed hashes match the current corpus", () => {
    const docs = loadPublicCorpus(repoRoot);
    const expected = hashesFromDocs(docs);
    const result = checkFreshness(repoRoot, expected);
    expect(result.ok).toBe(true);
  });

  it("fails red with the pnpm index hint when a hash is missing", () => {
    const result = checkFreshness(repoRoot, []);
    expect(result.ok).toBe(false);
    expect(result.message).toContain(FRESHNESS_HINT);
    expect(result.message).toContain("missing");
  });

  it("the committed index matches the current public corpus", () => {
    const result = checkFreshness(
      repoRoot,
      CORPUS_INDEX.chunks.map((c) => c.contentHash),
    );
    expect(result.ok, result.message).toBe(true);
    expect(CORPUS_INDEX.chunks.length).toBeGreaterThan(0);
  });
});
