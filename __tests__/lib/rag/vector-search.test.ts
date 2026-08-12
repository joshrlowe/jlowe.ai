/**
 * Tests for lib/rag/vector-search.ts — hybrid retrieval (vector + keyword →
 * RRF → hydrate → rerank). Prisma raw queries and the embedder/reranker are
 * mocked; rrfMerge runs for real.
 */

jest.mock("@/lib/rag/embed", () => ({
  generateQueryEmbedding: jest.fn(),
}));
jest.mock("@/lib/rag/rerank", () => ({
  // Identity rerank: keep candidate order, honor nothing else.
  rerankCandidates: jest.fn(async (_q: string, candidates: unknown[]) => candidates),
}));

import prisma from "@/lib/prisma";
import { generateQueryEmbedding } from "@/lib/rag/embed";
import { rerankCandidates } from "@/lib/rag/rerank";
import { searchKnowledge } from "@/lib/rag/vector-search";
import type { TraceHandle } from "@/lib/observability/langfuse";

const embedMock = generateQueryEmbedding as jest.Mock;
const rerankMock = rerankCandidates as jest.Mock;
const queryRawMock = prisma.$queryRaw as jest.Mock;
const findManyMock = prisma.knowledgeChunk.findMany as jest.Mock;

function chunkRow(id: string) {
  return {
    id,
    sourceType: "article",
    sourceId: `src-${id}`,
    sourceSlug: null,
    sourceTitle: `Title ${id}`,
    headingPath: [],
    content: `Content ${id}`,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  embedMock.mockResolvedValue([0.1, 0.2]);
  queryRawMock.mockResolvedValue([]);
  findManyMock.mockResolvedValue([]);
});

describe("searchKnowledge", () => {
  it("returns [] for a blank query without touching the DB", async () => {
    await expect(searchKnowledge("   ")).resolves.toEqual([]);
    expect(embedMock).not.toHaveBeenCalled();
    expect(queryRawMock).not.toHaveBeenCalled();
  });

  it("runs vector + keyword search, merges via RRF, hydrates, and returns topK", async () => {
    queryRawMock
      .mockResolvedValueOnce([
        { id: "a", semantic_score: 0.9 },
        { id: "b", semantic_score: 0.8 },
      ])
      .mockResolvedValueOnce([
        { id: "b", keyword_score: 0.7 },
        { id: "c", keyword_score: 0.6 },
      ]);
    findManyMock.mockResolvedValue([chunkRow("a"), chunkRow("b"), chunkRow("c")]);

    const results = await searchKnowledge("hybrid search", { topK: 2 });

    expect(queryRawMock).toHaveBeenCalledTimes(2);
    // b appears in both lists, so RRF ranks it first.
    expect(results.map((r) => r.id)).toEqual(["b", "a"]);
    expect(results[0]).toMatchObject({
      sourceTitle: "Title b",
      content: "Content b",
    });
    expect(results[0].score).toBeGreaterThan(0);
    expect(rerankMock).toHaveBeenCalledWith(
      "hybrid search",
      expect.any(Array),
      expect.objectContaining({ topN: 2 })
    );
  });

  it("returns [] when both searches come back empty", async () => {
    await expect(searchKnowledge("no hits")).resolves.toEqual([]);
    expect(findManyMock).not.toHaveBeenCalled();
    expect(rerankMock).not.toHaveBeenCalled();
  });

  it("drops fused ids whose rows are missing at hydration", async () => {
    queryRawMock
      .mockResolvedValueOnce([{ id: "a", semantic_score: 0.9 }])
      .mockResolvedValueOnce([{ id: "ghost", keyword_score: 0.5 }]);
    findManyMock.mockResolvedValue([chunkRow("a")]);

    const results = await searchKnowledge("q");
    expect(results.map((r) => r.id)).toEqual(["a"]);
  });

  it("trims the query before embedding and searching", async () => {
    queryRawMock
      .mockResolvedValueOnce([{ id: "a", semantic_score: 0.9 }])
      .mockResolvedValueOnce([]);
    findManyMock.mockResolvedValue([chunkRow("a")]);

    await searchKnowledge("  padded  ");
    expect(embedMock).toHaveBeenCalledWith("padded");
  });

  it("passes the sourceTypes filter into both raw queries", async () => {
    queryRawMock
      .mockResolvedValueOnce([{ id: "a", semantic_score: 0.9 }])
      .mockResolvedValueOnce([]);
    findManyMock.mockResolvedValue([chunkRow("a")]);

    await searchKnowledge("q", { sourceTypes: ["article", "project"] });

    // Prisma.sql templates carry their interpolated values.
    const sqlValues = queryRawMock.mock.calls.map((c) => JSON.stringify(c[0]?.values ?? []));
    expect(sqlValues[0]).toContain("article");
    expect(sqlValues[1]).toContain("article");
  });

  it("records spans on a provided trace handle", async () => {
    const span = { end: jest.fn(), fail: jest.fn() };
    const trace = {
      id: "t1",
      span: jest.fn(() => span),
      generation: jest.fn(),
      end: jest.fn(),
      flush: jest.fn(),
    } as unknown as TraceHandle;

    queryRawMock
      .mockResolvedValueOnce([{ id: "a", semantic_score: 0.9 }])
      .mockResolvedValueOnce([]);
    findManyMock.mockResolvedValue([chunkRow("a")]);

    await searchKnowledge("q", { trace });

    const spanNames = (trace.span as jest.Mock).mock.calls.map((c) => c[0]);
    expect(spanNames).toEqual(["embedding", "vector_search", "keyword_search", "rrf_merge"]);
    expect(span.end).toHaveBeenCalledTimes(4);
  });
});
