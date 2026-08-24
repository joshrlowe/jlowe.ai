/**
 * Hybrid retrieval over the committed corpus index.
 *
 * Titan v2 query embed (1024-dim, `normalize: true`) + cosine vs committed
 * chunk embeddings (if present) run in parallel with BM25, then merge via
 * `rrfMerge(..., { k: 60, topN: 20 })`. Rerank is skipped here (fail-open:
 * slice `topK`).
 *
 * Fail-open:
 * - missing chunk embeddings → BM25-only
 * - Titan embed failure → BM25-only
 * - never throws
 *
 * Swap this for S3 Vectors (or another remote store) when either chunk count
 * exceeds ~2,000 or p50 `searchKnowledge()` exceeds 20 ms. Keep this
 * function's interface identical to v1 `lib/rag/vector-search.ts` so that
 * swap is a drop-in.
 */

import { bm25Rank } from "./bm25.js";
import { cosine } from "./cosine.js";
import { generateQueryEmbedding } from "./embed.js";
import { CORPUS_INDEX } from "./index.generated.js";
import { rrfMerge } from "./rrf.js";
import {
  HYBRID_TOP_N,
  RRF_K,
  type CorpusIndex,
  type IndexedChunk,
} from "./types.js";

export interface RetrievedChunk {
  id: string;
  sourceType: string;
  sourceId: string;
  sourceSlug: string | null;
  sourceTitle: string;
  headingPath: string[];
  content: string;
  score: number;
  rerankScore?: number;
}

export interface SearchKnowledgeOptions {
  topK?: number;
  sourceTypes?: string[];
  /** Test seam. Defaults to Titan v2 query embed. */
  embedQuery?: (text: string) => Promise<number[]>;
  /** Test seam. Defaults to the committed `CORPUS_INDEX`. */
  index?: CorpusIndex;
}

function chunksWithEmbeddings(chunks: readonly IndexedChunk[]): boolean {
  return chunks.some((c) => c.embedding && c.embedding.length > 0);
}

function cosineRank(
  chunks: readonly IndexedChunk[],
  queryVec: readonly number[],
  topN: number,
): Array<{ id: string; score: number }> {
  const scored: Array<{ id: string; score: number }> = [];
  for (const chunk of chunks) {
    const embedding = chunk.embedding;
    if (!embedding || embedding.length === 0) continue;
    scored.push({ id: chunk.id, score: cosine(queryVec, embedding) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

function toRetrieved(chunk: IndexedChunk, score: number): RetrievedChunk {
  return {
    id: chunk.id,
    sourceType: chunk.sourceType,
    sourceId: chunk.sourceId,
    sourceSlug: chunk.sourceSlug,
    sourceTitle: chunk.sourceTitle,
    headingPath: chunk.headingPath,
    content: chunk.content,
    score,
  };
}

export async function searchKnowledge(
  query: string,
  options: SearchKnowledgeOptions = {},
): Promise<RetrievedChunk[]> {
  try {
    const topK = options.topK ?? 5;
    const index = options.index ?? CORPUS_INDEX;
    const embedQuery = options.embedQuery ?? generateQueryEmbedding;
    const trimmed = query.trim();
    if (!trimmed) return [];

    let chunks = index.chunks;
    if (options.sourceTypes && options.sourceTypes.length > 0) {
      const allow = new Set(options.sourceTypes);
      chunks = chunks.filter((c) => allow.has(c.sourceType));
    }
    if (chunks.length === 0) return [];

    const embedPromise = chunksWithEmbeddings(chunks)
      ? embedQuery(trimmed).catch((error: unknown) => {
          console.error(
            JSON.stringify({
              level: "warn",
              msg: "embed_query_failed",
              error: String(error),
            }),
          );
          return null;
        })
      : Promise.resolve(null);

    const bm25Hits = bm25Rank(trimmed, chunks, index.bm25, HYBRID_TOP_N);

    let vectorHits: Array<{ id: string; score: number }> = [];
    const queryVec = await embedPromise;
    if (queryVec && queryVec.length > 0) {
      vectorHits = cosineRank(chunks, queryVec, HYBRID_TOP_N);
    }

    const rankings: Array<Array<{ id: string }>> = [];
    if (vectorHits.length > 0) rankings.push(vectorHits);
    if (bm25Hits.length > 0) rankings.push(bm25Hits);
    if (rankings.length === 0) return [];

    const fused = rrfMerge(rankings, { k: RRF_K, topN: HYBRID_TOP_N });
    const byId = new Map(chunks.map((c) => [c.id, c]));
    const ordered: RetrievedChunk[] = [];
    for (const hit of fused) {
      const row = byId.get(hit.id);
      if (!row) continue;
      ordered.push(toRetrieved(row, hit.score));
      if (ordered.length >= topK) break;
    }
    return ordered;
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "warn",
        msg: "search_knowledge_failed",
        error: String(error),
      }),
    );
    return [];
  }
}
