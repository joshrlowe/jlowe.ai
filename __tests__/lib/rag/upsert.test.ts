/**
 * Tests for lib/rag/upsert.ts — single-source index upsert with the
 * content-hash gate and atomic delete+insert transaction.
 *
 * Prisma is globally mocked (__mocks__/prisma.js: $transaction invokes the
 * callback with the mock itself). The embedder is mocked at module level.
 */

import { createHash } from "node:crypto";
import type { Post, Project } from "@prisma/client";

jest.mock("@/lib/rag/embed", () => ({
  generateQueryEmbedding: jest.fn(),
  EMBEDDING_DIMENSIONS: 1024,
}));

import prisma from "@/lib/prisma";
import { generateQueryEmbedding } from "@/lib/rag/embed";
import { chunkMarkdown } from "@/lib/rag/chunker";
import {
  loadOneSource,
  deleteSourceChunks,
  sweepSingletonChunks,
  upsertSourceChunks,
} from "@/lib/rag/upsert";
import type { KnowledgeSource } from "@/lib/rag/sources";

const embedMock = generateQueryEmbedding as jest.Mock;

// The chunker drops fragments under MIN_TOKENS (80), so the fixture body has
// to be a real paragraph, not a one-liner.
const BODY =
  "Retrieval augmented generation grounds a language model in indexed source " +
  "material so its answers cite something real instead of hallucinating. ".repeat(8);

const SOURCE: KnowledgeSource = {
  sourceType: "article",
  sourceId: "post-1",
  sourceSlug: "ai/hello",
  sourceTitle: "Hello",
  markdown: `# Hello\n\n${BODY}`,
  url: "/articles/ai/hello",
};

function hashOf(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

beforeEach(() => {
  jest.clearAllMocks();
  embedMock.mockResolvedValue([0.1, 0.2, 0.3]);
});

describe("loadOneSource", () => {
  it("returns null for an article without a sourceId", async () => {
    await expect(loadOneSource("article")).resolves.toBeNull();
  });

  it("returns null for a missing or unpublished post", async () => {
    jest.spyOn(prisma.post, "findUnique").mockResolvedValueOnce(null as never);
    await expect(loadOneSource("article", "p1")).resolves.toBeNull();

    jest
      .spyOn(prisma.post, "findUnique")
      .mockResolvedValueOnce({ id: "p1", status: "Draft" } as unknown as Post as never);
    await expect(loadOneSource("article", "p1")).resolves.toBeNull();
  });

  it("formats a published post", async () => {
    jest.spyOn(prisma.post, "findUnique").mockResolvedValueOnce({
      id: "p1",
      status: "Published",
      title: "T",
      topic: "ai",
      slug: "t",
      description: null,
      content: "Body",
    } as unknown as Post as never);
    const src = await loadOneSource("article", "p1");
    expect(src?.sourceType).toBe("article");
    expect(src?.sourceSlug).toBe("ai/t");
  });

  it("returns null for a project without id, missing, or Draft", async () => {
    await expect(loadOneSource("project")).resolves.toBeNull();

    jest.spyOn(prisma.project, "findUnique").mockResolvedValueOnce(null as never);
    await expect(loadOneSource("project", "x")).resolves.toBeNull();

    jest
      .spyOn(prisma.project, "findUnique")
      .mockResolvedValueOnce({ id: "x", status: "Draft", title: "P" } as unknown as Project as never);
    await expect(loadOneSource("project", "x")).resolves.toBeNull();
  });

  it("formats a non-draft project", async () => {
    jest.spyOn(prisma.project, "findUnique").mockResolvedValueOnce({
      id: "x",
      status: "Published",
      title: "P",
      slug: "p",
      description: null,
      shortDescription: null,
      longDescription: "Long",
      techStack: null,
      tags: null,
    } as unknown as Project as never);
    const src = await loadOneSource("project", "x");
    expect(src?.sourceType).toBe("project");
  });

  it("loads singleton sources and returns null when absent", async () => {
    jest.spyOn(prisma.about, "findFirst").mockResolvedValueOnce(null as never);
    await expect(loadOneSource("about")).resolves.toBeNull();

    jest
      .spyOn(prisma.welcome, "findFirst")
      .mockResolvedValueOnce({ id: "w", name: "Josh", briefBio: "Bio" } as never);
    const w = await loadOneSource("welcome");
    expect(w?.sourceType).toBe("welcome");

    jest
      .spyOn(prisma.contact, "findFirst")
      .mockResolvedValueOnce({ id: "c", emailAddress: "j@x.com" } as never);
    const c = await loadOneSource("contact");
    expect(c?.sourceType).toBe("contact");
  });
});

describe("deleteSourceChunks / sweepSingletonChunks", () => {
  it("deletes by (sourceType, sourceId) and reports the count", async () => {
    jest.spyOn(prisma.knowledgeChunk, "deleteMany").mockResolvedValueOnce({ count: 4 } as never);
    await expect(deleteSourceChunks("article", "p1")).resolves.toEqual({ deleted: 4 });
    expect(prisma.knowledgeChunk.deleteMany).toHaveBeenCalledWith({
      where: { sourceType: "article", sourceId: "p1" },
    });
  });

  it("sweeps a singleton type regardless of id", async () => {
    jest.spyOn(prisma.knowledgeChunk, "deleteMany").mockResolvedValueOnce({ count: 2 } as never);
    await expect(sweepSingletonChunks("about")).resolves.toEqual({ deleted: 2 });
    expect(prisma.knowledgeChunk.deleteMany).toHaveBeenCalledWith({
      where: { sourceType: "about" },
    });
  });
});

describe("upsertSourceChunks", () => {
  it("clears stale chunks and reports empty for content that yields no chunks", async () => {
    const result = await upsertSourceChunks({ ...SOURCE, markdown: "   " });
    expect(result).toMatchObject({ action: "empty", chunkCount: 0, embedCalls: 0 });
    expect(prisma.knowledgeChunk.deleteMany).toHaveBeenCalledWith({
      where: { sourceType: "article", sourceId: "post-1" },
    });
  });

  it("sweeps the whole singleton type when a singleton source is empty", async () => {
    await upsertSourceChunks({
      ...SOURCE,
      sourceType: "welcome",
      markdown: "",
    });
    expect(prisma.knowledgeChunk.deleteMany).toHaveBeenCalledWith({
      where: { sourceType: "welcome" },
    });
  });

  it("skips when every chunk hash already matches", async () => {
    const chunks = chunkMarkdown(SOURCE.markdown);
    jest.spyOn(prisma.knowledgeChunk, "findMany").mockResolvedValueOnce(
      chunks.map((c, i) => ({ chunkIndex: i, contentHash: hashOf(c.content) })) as never
    );

    const result = await upsertSourceChunks(SOURCE);

    expect(result.action).toBe("skip");
    expect(result.embedCalls).toBe(0);
    expect(embedMock).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("inserts fresh chunks (delete + raw insert in one transaction)", async () => {
    jest.spyOn(prisma.knowledgeChunk, "findMany").mockResolvedValueOnce([] as never);

    const result = await upsertSourceChunks(SOURCE);
    const chunkCount = chunkMarkdown(SOURCE.markdown).length;

    expect(result).toMatchObject({
      action: "insert",
      chunkCount,
      embedCalls: chunkCount,
    });
    expect(embedMock).toHaveBeenCalledTimes(chunkCount);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.knowledgeChunk.deleteMany).toHaveBeenCalledWith({
      where: { sourceType: "article", sourceId: "post-1" },
    });
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(chunkCount);
  });

  it("reports update when replacing existing mismatched chunks", async () => {
    jest
      .spyOn(prisma.knowledgeChunk, "findMany")
      .mockResolvedValueOnce([{ chunkIndex: 0, contentHash: "stale" }] as never);

    const result = await upsertSourceChunks(SOURCE);
    expect(result.action).toBe("update");
  });

  it("retries embedding with backoff and eventually succeeds", async () => {
    jest.useFakeTimers();
    try {
      jest.spyOn(prisma.knowledgeChunk, "findMany").mockResolvedValueOnce([] as never);
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      embedMock.mockRejectedValueOnce(new Error("throttled")).mockResolvedValue([0.5]);

      const pending = upsertSourceChunks(SOURCE);
      await jest.runAllTimersAsync();
      const result = await pending;

      expect(result.action).toBe("insert");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("embed retry 1/3"));
      warn.mockRestore();
    } finally {
      jest.useRealTimers();
    }
  });

  it("gives up after exhausting embed retries", async () => {
    jest.useFakeTimers();
    try {
      jest.spyOn(prisma.knowledgeChunk, "findMany").mockResolvedValueOnce([] as never);
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      embedMock.mockRejectedValue(new Error("hard down"));

      const pending = upsertSourceChunks(SOURCE);
      const assertion = expect(pending).rejects.toThrow("hard down");
      await jest.runAllTimersAsync();
      await assertion;

      expect(prisma.$transaction).not.toHaveBeenCalled();
      warn.mockRestore();
    } finally {
      jest.useRealTimers();
    }
  });
});
