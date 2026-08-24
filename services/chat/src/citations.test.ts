import type { RetrievedChunk } from "@velocity/corpus-index";
import { describe, expect, it } from "vitest";

import {
  CONTEXT_PREAMBLE,
  buildCitations,
  citationUrl,
  formatContext,
  snippetOf,
} from "./citations.js";

function chunk(
  overrides: Partial<RetrievedChunk> &
    Pick<RetrievedChunk, "sourceType" | "sourceSlug" | "sourceTitle">,
): RetrievedChunk {
  return {
    id: overrides.id ?? "id",
    sourceId: overrides.sourceId ?? overrides.sourceSlug ?? "id",
    headingPath: overrides.headingPath ?? [],
    content: overrides.content ?? "body",
    score: overrides.score ?? 1,
    ...overrides,
  };
}

describe("citationUrl", () => {
  it("emits exported routes with a trailing slash", () => {
    expect(citationUrl({ sourceType: "project", sourceSlug: "jarvis" })).toBe(
      "/projects/jarvis/",
    );
    expect(
      citationUrl({ sourceType: "article", sourceSlug: "rag-that-cites" }),
    ).toBe("/articles/rag-that-cites/");
    expect(citationUrl({ sourceType: "faq", sourceSlug: "about" })).toBe(
      "/about/",
    );
  });

  it("returns null for unknown types", () => {
    expect(citationUrl({ sourceType: "faq", sourceSlug: "mystery" })).toBe(
      null,
    );
    expect(citationUrl({ sourceType: "project", sourceSlug: null })).toBe(null);
  });
});

describe("formatContext", () => {
  it("prefixes the cite-inline preamble and numbers sources", () => {
    const formatted = formatContext([
      chunk({
        sourceType: "project",
        sourceSlug: "jarvis",
        sourceTitle: "Jarvis",
        headingPath: ["Architecture", "Memory"],
        content: "pgvector store",
      }),
    ]);
    expect(formatted.startsWith(CONTEXT_PREAMBLE)).toBe(true);
    expect(formatted).toContain("[1] Jarvis › Architecture › Memory");
    expect(formatted).toContain("pgvector store");
  });

  it("still emits the preamble when retrieval is empty", () => {
    expect(formatContext([])).toBe(CONTEXT_PREAMBLE);
  });
});

describe("buildCitations", () => {
  it("keeps trailing slashes and caps snippets", () => {
    const items = buildCitations([
      chunk({
        sourceType: "project",
        sourceSlug: "jarvis",
        sourceTitle: "Jarvis",
        content: "x".repeat(250),
      }),
    ]);
    expect(items[0]?.url).toBe("/projects/jarvis/");
    expect(items[0]?.url.endsWith("/")).toBe(true);
    expect(items[0]?.snippet).toBe(snippetOf("x".repeat(250)));
    expect(items[0]?.snippet.endsWith("…")).toBe(true);
    expect(items[0]?.snippet.length).toBeLessThanOrEqual(201);
  });
});
