import { describe, expect, it, vi } from "vitest";

import {
  applyEmbeddings,
  embedMissingChunks,
  embeddingsByHash,
} from "./embeddings.js";
import type { IndexedChunk } from "./types.js";

function chunk(contentHash: string, embedding?: number[]): IndexedChunk {
  return {
    id: contentHash,
    contentHash,
    sourceType: "project",
    sourceId: contentHash,
    sourceSlug: contentHash,
    sourceTitle: contentHash,
    headingPath: [],
    content: contentHash,
    tokenCount: 1,
    chunkIndex: 0,
    termFreqs: { [contentHash]: 1 },
    docLength: 1,
    ...(embedding ? { embedding } : {}),
  };
}

describe("embeddingsByHash / applyEmbeddings", () => {
  it("reuses vectors for matching contentHash and omits the rest", () => {
    const previous = embeddingsByHash([chunk("aaa", [0.1, 0.2])]);
    const applied = applyEmbeddings([chunk("aaa"), chunk("bbb")], previous);
    expect(applied[0]?.embedding).toEqual([0.1, 0.2]);
    expect(applied[1]?.embedding).toBeUndefined();
  });
});

describe("embedMissingChunks", () => {
  it("does not re-embed hashes already present", async () => {
    const embed = vi.fn(async () => [1, 0]);
    const previous = new Map([["aaa", [0.5, 0.5]]]);
    const result = await embedMissingChunks(
      [chunk("aaa"), chunk("bbb")],
      previous,
      embed,
    );
    expect(embed).toHaveBeenCalledTimes(1);
    expect(embed).toHaveBeenCalledWith("bbb");
    expect(result.reused).toBe(1);
    expect(result.embedded).toBe(1);
    expect(result.byHash.get("aaa")).toEqual([0.5, 0.5]);
    expect(result.byHash.get("bbb")).toEqual([1, 0]);
  });

  it("stops calling Titan after a failure and keeps prior vectors", async () => {
    const embed = vi.fn().mockRejectedValueOnce(new Error("ExpiredToken"));
    const previous = new Map([["aaa", [9, 9]]]);
    const result = await embedMissingChunks(
      [chunk("aaa"), chunk("bbb"), chunk("ccc")],
      previous,
      embed,
    );
    expect(result.awsFailed).toBe(true);
    expect(result.embedded).toBe(0);
    expect(result.omitted).toBe(2);
    expect(result.byHash.get("aaa")).toEqual([9, 9]);
    expect(embed).toHaveBeenCalledTimes(1);
  });
});
