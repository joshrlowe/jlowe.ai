import { describe, expect, it, vi } from "vitest";

import { buildBm25Stats, termFrequencies, tokenize } from "./bm25.js";
import { contentSha256 } from "./hash.js";
import { searchKnowledge } from "./search.js";
import type { CorpusIndex, IndexedChunk } from "./types.js";

function makeChunk(partial: {
  id: string;
  content: string;
  embedding?: number[];
  sourceType?: string;
}): IndexedChunk {
  const tokens = tokenize(partial.content);
  return {
    id: partial.id,
    contentHash: contentSha256(partial.content),
    sourceType: partial.sourceType ?? "project",
    sourceId: partial.id,
    sourceSlug: partial.id,
    sourceTitle: partial.id,
    headingPath: [],
    content: partial.content,
    tokenCount: tokens.length,
    chunkIndex: 0,
    termFreqs: termFrequencies(tokens),
    docLength: tokens.length,
    ...(partial.embedding ? { embedding: partial.embedding } : {}),
  };
}

function tinyIndex(chunks: IndexedChunk[]): CorpusIndex {
  return { version: 1, chunks, bm25: buildBm25Stats(chunks) };
}

describe("searchKnowledge", () => {
  it("returns [] for an empty query without embedding", async () => {
    const embedQuery = vi.fn(async () => [1, 0]);
    const index = tinyIndex([
      makeChunk({ id: "a", content: "alpha", embedding: [1, 0] }),
    ]);
    await expect(
      searchKnowledge("   ", { index, embedQuery }),
    ).resolves.toEqual([]);
    expect(embedQuery).not.toHaveBeenCalled();
  });

  it("hybrid RRF: a chunk in both rankings beats one in only one", async () => {
    const vec = makeChunk({
      id: "vec",
      content: "zzzz unrelated",
      embedding: [0.7, 0.7],
    });
    const kw = makeChunk({
      id: "kw",
      content: "alpha uniquekeyword",
    });
    const both = makeChunk({
      id: "both",
      content: "alpha uniquekeyword also",
      embedding: [1, 0],
    });
    const index = tinyIndex([vec, kw, both]);
    const results = await searchKnowledge("uniquekeyword", {
      index,
      embedQuery: async () => [1, 0],
      topK: 3,
    });
    expect(results[0]?.id).toBe("both");
    expect(results.map((r) => r.id).sort()).toEqual(["both", "kw", "vec"]);
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
  });

  it("BM25-only when chunk embeddings are absent (does not call embed)", async () => {
    const embedQuery = vi.fn(async () => {
      throw new Error("should not embed");
    });
    const index = tinyIndex([
      makeChunk({ id: "kw", content: "alpha uniquekeyword" }),
      makeChunk({ id: "other", content: "unrelated zzzz" }),
    ]);
    const results = await searchKnowledge("uniquekeyword", {
      index,
      embedQuery,
      topK: 5,
    });
    expect(embedQuery).not.toHaveBeenCalled();
    expect(results[0]?.id).toBe("kw");
    expect(results.map((r) => r.id)).not.toContain("other");
  });

  it("BM25-only when Titan embed fails, and never throws", async () => {
    const index = tinyIndex([
      makeChunk({
        id: "kw",
        content: "alpha uniquekeyword",
        embedding: [1, 0],
      }),
      makeChunk({
        id: "other",
        content: "unrelated zzzz",
        embedding: [0, 1],
      }),
    ]);
    const results = await searchKnowledge("uniquekeyword", {
      index,
      embedQuery: async () => {
        throw new Error("ExpiredToken");
      },
    });
    expect(results[0]?.id).toBe("kw");
  });
});
