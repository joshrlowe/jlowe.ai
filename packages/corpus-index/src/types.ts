/**
 * Build-time embedded retrieval index.
 *
 * The public corpus is ~26 KB (~30–50 chunks). Brute-force BM25 + cosine over
 * that set is sub-millisecond and adds zero network hops to a Lambda cold
 * start. Swap this bundle for S3 Vectors (or another remote store) when
 * either chunk count exceeds ~2,000 or p50 `searchKnowledge()` exceeds 20 ms.
 * Keep `searchKnowledge()`'s interface identical to v1
 * (`lib/rag/vector-search.ts`) so that swap is a drop-in.
 */

export const INDEX_VERSION = 1 as const;

export const BM25_K1 = 1.2;
export const BM25_B = 0.75;

/** RRF constants — match v1 `lib/rag/rrf.ts` and `vector-search.ts`. */
export const RRF_K = 60;
export const HYBRID_TOP_N = 20;

export interface IndexedChunk {
  id: string;
  contentHash: string;
  sourceType: string;
  sourceId: string;
  sourceSlug: string;
  sourceTitle: string;
  headingPath: string[];
  content: string;
  tokenCount: number;
  chunkIndex: number;
  termFreqs: Record<string, number>;
  docLength: number;
}

export interface Bm25Stats {
  k1: number;
  b: number;
  /** Document count N. */
  n: number;
  /** Average document length in tokens. */
  avgdl: number;
  /** Document frequency per term. */
  df: Record<string, number>;
}

export interface CorpusIndex {
  version: typeof INDEX_VERSION;
  chunks: IndexedChunk[];
  bm25: Bm25Stats;
}
