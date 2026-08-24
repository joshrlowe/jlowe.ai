/**
 * BM25 over precomputed per-chunk term frequencies.
 *
 * There is no Lambda equivalent of Postgres `tsvector`, so the keyword half
 * of hybrid retrieval is BM25 with df / tf baked into the committed index at
 * build time. Query-time work is a loop over ~50 chunks.
 */

import { BM25_B, BM25_K1, type Bm25Stats } from "./types.js";

/** Lowercase alphanumeric tokens, dropping single-character noise. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

export function termFrequencies(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  for (const t of tokens) {
    tf[t] = (tf[t] ?? 0) + 1;
  }
  return tf;
}

export function buildBm25Stats(
  docs: ReadonlyArray<{ termFreqs: Record<string, number>; docLength: number }>,
): Bm25Stats {
  const n = docs.length;
  const avgdl = n === 0 ? 0 : docs.reduce((sum, d) => sum + d.docLength, 0) / n;
  const df: Record<string, number> = {};
  for (const doc of docs) {
    for (const term of Object.keys(doc.termFreqs)) {
      df[term] = (df[term] ?? 0) + 1;
    }
  }
  return { k1: BM25_K1, b: BM25_B, n, avgdl, df };
}

/** Robertson–Sparck Jones IDF with the Elasticsearch +1 smoothing. */
export function idf(term: string, stats: Bm25Stats): number {
  const df = stats.df[term] ?? 0;
  return Math.log(1 + (stats.n - df + 0.5) / (df + 0.5));
}

export function bm25Score(
  queryTokens: readonly string[],
  termFreqs: Record<string, number>,
  docLength: number,
  stats: Bm25Stats,
): number {
  if (queryTokens.length === 0 || stats.n === 0) return 0;
  const avgdl = stats.avgdl || 1;
  let score = 0;
  const seen = new Set<string>();
  for (const term of queryTokens) {
    if (seen.has(term)) continue;
    seen.add(term);
    const tf = termFreqs[term] ?? 0;
    if (tf === 0) continue;
    const denom = tf + stats.k1 * (1 - stats.b + (stats.b * docLength) / avgdl);
    score += (idf(term, stats) * (tf * (stats.k1 + 1))) / denom;
  }
  return score;
}

export interface Bm25Hit {
  id: string;
  score: number;
}

export function bm25Rank(
  query: string,
  docs: ReadonlyArray<{
    id: string;
    termFreqs: Record<string, number>;
    docLength: number;
  }>,
  stats: Bm25Stats,
  topN: number,
): Bm25Hit[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];
  const scored: Bm25Hit[] = [];
  for (const doc of docs) {
    const score = bm25Score(queryTokens, doc.termFreqs, doc.docLength, stats);
    if (score > 0) scored.push({ id: doc.id, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}
