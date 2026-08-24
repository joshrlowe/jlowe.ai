import type { IndexedChunk } from "./types.js";

/** Previously committed Titan vectors, keyed by content hash. */
export function embeddingsByHash(
  chunks: readonly Pick<IndexedChunk, "contentHash" | "embedding">[],
): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (const chunk of chunks) {
    if (chunk.embedding && chunk.embedding.length > 0) {
      map.set(chunk.contentHash, chunk.embedding);
    }
  }
  return map;
}

/** Attach vectors onto chunks by contentHash; omit the field when missing. */
export function applyEmbeddings(
  chunks: readonly IndexedChunk[],
  byHash: ReadonlyMap<string, number[]>,
): IndexedChunk[] {
  return chunks.map((chunk) => {
    const embedding = byHash.get(chunk.contentHash);
    if (!embedding) {
      const { embedding: _drop, ...rest } = chunk;
      return rest;
    }
    return { ...chunk, embedding };
  });
}

/**
 * Embed only hashes not already in `previousByHash`. On the first embed
 * failure (no AWS creds, throttling, …) stop calling Titan and keep whatever
 * prior vectors still match. Never throws.
 */
export async function embedMissingChunks(
  chunks: readonly IndexedChunk[],
  previousByHash: ReadonlyMap<string, number[]>,
  embed: (text: string) => Promise<number[]>,
): Promise<{
  byHash: Map<string, number[]>;
  embedded: number;
  reused: number;
  omitted: number;
  awsFailed: boolean;
}> {
  const byHash = new Map(previousByHash);
  let embedded = 0;
  let reused = 0;
  let awsFailed = false;

  for (const chunk of chunks) {
    if (byHash.has(chunk.contentHash)) {
      reused += 1;
      continue;
    }
    if (awsFailed) continue;
    try {
      const vec = await embed(chunk.content);
      if (vec.length === 0) continue;
      byHash.set(chunk.contentHash, vec);
      embedded += 1;
    } catch (error) {
      awsFailed = true;
      console.warn(
        `corpus-index: Titan embed failed (${String(error)}); keeping prior embeddings by contentHash`,
      );
    }
  }

  const omitted = chunks.filter((c) => !byHash.has(c.contentHash)).length;
  return { byHash, embedded, reused, omitted, awsFailed };
}
