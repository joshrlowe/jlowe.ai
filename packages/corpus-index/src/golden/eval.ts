import { searchKnowledge } from "../search.js";
import type { CorpusIndex } from "../types.js";

export interface GoldenQuery {
  id: string;
  query: string;
  expectedSourceIds: string[];
  embedding: number[];
}

export interface QueryScore {
  id: string;
  query: string;
  hit: boolean;
  rank: number | null;
  topSourceIds: string[];
}

export interface RetrievalReport {
  recallAtK: number;
  mrr: number;
  scores: QueryScore[];
}

/**
 * Credential-free retrieval eval: cosine + BM25 + RRF using the committed
 * query vectors, never Titan. `k` is the cutoff for recall@k / MRR.
 */
export async function evaluateRetrieval(
  queries: readonly GoldenQuery[],
  options: { index?: CorpusIndex; k?: number } = {},
): Promise<RetrievalReport> {
  const k = options.k ?? 5;
  const scores: QueryScore[] = [];
  for (const q of queries) {
    const hits = await searchKnowledge(q.query, {
      topK: k,
      index: options.index,
      embedQuery: async () => q.embedding,
    });
    const topSourceIds = hits.map((h) => h.sourceId);
    const expected = new Set(q.expectedSourceIds);
    let rank: number | null = null;
    for (let i = 0; i < hits.length; i++) {
      const id = hits[i]?.sourceId;
      if (id && expected.has(id)) {
        rank = i + 1;
        break;
      }
    }
    scores.push({
      id: q.id,
      query: q.query,
      hit: rank !== null,
      rank,
      topSourceIds,
    });
  }
  const hits = scores.filter((s) => s.hit).length;
  const mrr =
    scores.reduce((sum, s) => sum + (s.rank ? 1 / s.rank : 0), 0) /
    scores.length;
  return {
    recallAtK: hits / scores.length,
    mrr,
    scores,
  };
}
