/**
 * Tests for the regenerate-embeddings Inngest function handler.
 *
 * The handler is exported separately from the wrapped Inngest function so
 * we can call it with a synthetic step object that just executes closures.
 */

import { regenerateEmbeddingsHandler } from "@/lib/jobs/regenerate-embeddings";

jest.mock("@/lib/observability/langfuse", () => ({
  startTrace: jest.fn().mockResolvedValue({
    id: null,
    span: () => ({ end: jest.fn(), fail: jest.fn() }),
    generation: () => ({
      end: jest.fn(),
      fail: jest.fn(),
      recordFirstToken: jest.fn(),
      recordUsage: jest.fn(),
    }),
    end: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock("@/lib/rag/upsert", () => ({
  loadOneSource: jest.fn(),
  upsertSourceChunks: jest.fn(),
  deleteSourceChunks: jest.fn(),
  sweepSingletonChunks: jest.fn(),
}));

jest.mock("@/lib/jobs/client", () => ({
  inngest: {
    createFunction: jest.fn(() => ({})),
    send: jest.fn(),
  },
}));

import {
  loadOneSource,
  upsertSourceChunks,
  deleteSourceChunks,
  sweepSingletonChunks,
} from "@/lib/rag/upsert";
// The handler's `@/lib/prisma` import is auto-routed to __mocks__/prisma.js
// via jest.config moduleNameMapper + jest.setup.js. Import the same mock
// instance here so we can program its return values per test.
import prisma from "@/__mocks__/prisma";

const loadOneSourceMock = loadOneSource as jest.MockedFunction<typeof loadOneSource>;
const upsertSourceChunksMock = upsertSourceChunks as jest.MockedFunction<typeof upsertSourceChunks>;
const deleteSourceChunksMock = deleteSourceChunks as jest.MockedFunction<typeof deleteSourceChunks>;
const sweepSingletonChunksMock = sweepSingletonChunks as jest.MockedFunction<
  typeof sweepSingletonChunks
>;

function buildFakeStep() {
  return {
    run: jest.fn(async (_id: string, fn: () => unknown) => fn()),
    sendEvent: jest.fn().mockResolvedValue({ ids: [] }),
  } as unknown as Parameters<typeof regenerateEmbeddingsHandler>[0]["step"];
}

const ARTICLE_SOURCE = {
  sourceType: "article" as const,
  sourceId: "post-1",
  sourceSlug: "tech/post-1",
  sourceTitle: "Test post",
  markdown: "# Test post\n\nbody",
  url: "/articles/tech/post-1",
};

const ABOUT_SOURCE = {
  sourceType: "about" as const,
  sourceId: "about-1",
  sourceSlug: null,
  sourceTitle: "About Josh",
  markdown: "# About Josh\n\nbio",
  url: "/about",
};

describe("regenerateEmbeddingsHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("content/post.updated", () => {
    it("loads the article and upserts chunks when published", async () => {
      loadOneSourceMock.mockResolvedValueOnce(ARTICLE_SOURCE);
      upsertSourceChunksMock.mockResolvedValueOnce({
        action: "update",
        sourceType: "article",
        sourceId: "post-1",
        chunkCount: 3,
        embedCalls: 3,
      });

      const result = await regenerateEmbeddingsHandler({
        event: {
          name: "content/post.updated",
          data: { postId: "post-1" },
        },
        step: buildFakeStep(),
      });

      expect(loadOneSourceMock).toHaveBeenCalledWith("article", "post-1");
      expect(upsertSourceChunksMock).toHaveBeenCalledWith(ARTICLE_SOURCE);
      expect(deleteSourceChunksMock).not.toHaveBeenCalled();
      expect(result).toMatchObject({ kind: "upserted", action: "update" });
    });

    it("deletes stale chunks when the article is no longer published", async () => {
      loadOneSourceMock.mockResolvedValueOnce(null);
      deleteSourceChunksMock.mockResolvedValueOnce({ deleted: 4 });

      const result = await regenerateEmbeddingsHandler({
        event: {
          name: "content/post.updated",
          data: { postId: "post-2" },
        },
        step: buildFakeStep(),
      });

      expect(loadOneSourceMock).toHaveBeenCalledWith("article", "post-2");
      expect(deleteSourceChunksMock).toHaveBeenCalledWith("article", "post-2");
      expect(upsertSourceChunksMock).not.toHaveBeenCalled();
      expect(result).toEqual({ kind: "deleted", deleted: 4 });
    });
  });

  describe("content/post.deleted", () => {
    it("deletes chunks for the post and does not load the source", async () => {
      deleteSourceChunksMock.mockResolvedValueOnce({ deleted: 7 });

      const result = await regenerateEmbeddingsHandler({
        event: {
          name: "content/post.deleted",
          data: { postId: "post-3" },
        },
        step: buildFakeStep(),
      });

      expect(deleteSourceChunksMock).toHaveBeenCalledWith("article", "post-3");
      expect(loadOneSourceMock).not.toHaveBeenCalled();
      expect(result).toEqual({ kind: "deleted", deleted: 7 });
    });
  });

  describe("content/project.upserted", () => {
    it("deletes stale chunks when project demotes to Draft (loadOneSource returns null)", async () => {
      loadOneSourceMock.mockResolvedValueOnce(null);
      deleteSourceChunksMock.mockResolvedValueOnce({ deleted: 2 });

      const result = await regenerateEmbeddingsHandler({
        event: {
          name: "content/project.upserted",
          data: { projectId: "proj-1" },
        },
        step: buildFakeStep(),
      });

      expect(loadOneSourceMock).toHaveBeenCalledWith("project", "proj-1");
      expect(deleteSourceChunksMock).toHaveBeenCalledWith("project", "proj-1");
      expect(upsertSourceChunksMock).not.toHaveBeenCalled();
      expect(result).toEqual({ kind: "deleted", deleted: 2 });
    });
  });

  describe("content/about.upserted", () => {
    it("sweeps all about chunks before upserting the latest singleton", async () => {
      sweepSingletonChunksMock.mockResolvedValueOnce({ deleted: 5 });
      loadOneSourceMock.mockResolvedValueOnce(ABOUT_SOURCE);
      upsertSourceChunksMock.mockResolvedValueOnce({
        action: "insert",
        sourceType: "about",
        sourceId: "about-1",
        chunkCount: 2,
        embedCalls: 2,
      });

      const result = await regenerateEmbeddingsHandler({
        event: {
          name: "content/about.upserted",
          data: {},
        },
        step: buildFakeStep(),
      });

      expect(sweepSingletonChunksMock).toHaveBeenCalledWith("about");
      expect(loadOneSourceMock).toHaveBeenCalledWith("about");
      expect(upsertSourceChunksMock).toHaveBeenCalledWith(ABOUT_SOURCE);
      // sweep happens before load+upsert
      const sweepOrder = sweepSingletonChunksMock.mock.invocationCallOrder[0];
      const upsertOrder = upsertSourceChunksMock.mock.invocationCallOrder[0];
      expect(sweepOrder).toBeLessThan(upsertOrder);
      expect(result).toMatchObject({ kind: "upserted", action: "insert" });
    });

    it("returns skipped when no about row exists", async () => {
      sweepSingletonChunksMock.mockResolvedValueOnce({ deleted: 0 });
      loadOneSourceMock.mockResolvedValueOnce(null);

      const result = await regenerateEmbeddingsHandler({
        event: {
          name: "content/about.upserted",
          data: {},
        },
        step: buildFakeStep(),
      });

      expect(upsertSourceChunksMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        kind: "skipped",
        reason: "no singleton row to index",
      });
    });
  });

  describe("knowledge/reindex.requested", () => {
    it("fans out one event per source when no scope is provided", async () => {
      (prisma.post.findMany as jest.Mock).mockResolvedValueOnce([
        { id: "post-1" },
        { id: "post-2" },
      ]);
      (prisma.project.findMany as jest.Mock).mockResolvedValueOnce([{ id: "proj-1" }]);

      const step = buildFakeStep();
      const result = await regenerateEmbeddingsHandler({
        event: {
          name: "knowledge/reindex.requested",
          data: {},
        },
        step,
      });

      expect(step.sendEvent).toHaveBeenCalledTimes(1);
      const [, sentEvents] = (step.sendEvent as jest.Mock).mock.calls[0];
      // 2 posts + 1 project + 3 singletons = 6 events
      expect(sentEvents).toHaveLength(6);
      expect(sentEvents).toEqual(
        expect.arrayContaining([
          {
            name: "knowledge/reindex.requested",
            data: { sourceType: "article", sourceId: "post-1" },
          },
          {
            name: "knowledge/reindex.requested",
            data: { sourceType: "article", sourceId: "post-2" },
          },
          {
            name: "knowledge/reindex.requested",
            data: { sourceType: "project", sourceId: "proj-1" },
          },
          {
            name: "knowledge/reindex.requested",
            data: { sourceType: "about" },
          },
          {
            name: "knowledge/reindex.requested",
            data: { sourceType: "welcome" },
          },
          {
            name: "knowledge/reindex.requested",
            data: { sourceType: "contact" },
          },
        ])
      );
      expect(result).toEqual({ kind: "fanout", emitted: 6 });
    });

    it("upserts a single source when scoped (article + sourceId)", async () => {
      loadOneSourceMock.mockResolvedValueOnce(ARTICLE_SOURCE);
      upsertSourceChunksMock.mockResolvedValueOnce({
        action: "skip",
        sourceType: "article",
        sourceId: "post-1",
        chunkCount: 3,
        embedCalls: 0,
      });

      const result = await regenerateEmbeddingsHandler({
        event: {
          name: "knowledge/reindex.requested",
          data: { sourceType: "article", sourceId: "post-1" },
        },
        step: buildFakeStep(),
      });

      expect(loadOneSourceMock).toHaveBeenCalledWith("article", "post-1");
      expect(upsertSourceChunksMock).toHaveBeenCalled();
      expect(result).toMatchObject({ kind: "upserted", action: "skip" });
    });

    it("dispatches to singleton handler when sourceType is about (no id needed)", async () => {
      sweepSingletonChunksMock.mockResolvedValueOnce({ deleted: 1 });
      loadOneSourceMock.mockResolvedValueOnce(ABOUT_SOURCE);
      upsertSourceChunksMock.mockResolvedValueOnce({
        action: "update",
        sourceType: "about",
        sourceId: "about-1",
        chunkCount: 1,
        embedCalls: 1,
      });

      const result = await regenerateEmbeddingsHandler({
        event: {
          name: "knowledge/reindex.requested",
          data: { sourceType: "about" },
        },
        step: buildFakeStep(),
      });

      expect(sweepSingletonChunksMock).toHaveBeenCalledWith("about");
      expect(loadOneSourceMock).toHaveBeenCalledWith("about");
      expect(result).toMatchObject({ kind: "upserted" });
    });
  });
});
