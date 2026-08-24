/**
 * Reciprocal Rank Fusion. Pure function so tests can hammer it.
 *
 * Ported verbatim from v1 `lib/rag/rrf.ts`. Each input list is a separate
 * ranking by some scorer. The fused score for an ID is sum over rankings of
 * 1 / (k + rank), with rank starting at 0. Standard k = 60 from the original
 * RRF paper. The query path uses k=60, top-20.
 */

export interface RankedItem {
  id: string;
}

export interface FusedScore {
  id: string;
  score: number;
}

export function rrfMerge<T extends RankedItem>(
  rankings: T[][],
  options: { k?: number; topN?: number } = {},
): FusedScore[] {
  const k = options.k ?? 60;
  const acc = new Map<string, number>();
  for (const list of rankings) {
    list.forEach((item, rank) => {
      acc.set(item.id, (acc.get(item.id) ?? 0) + 1 / (k + rank + 1));
    });
  }
  const merged: FusedScore[] = [];
  acc.forEach((score, id) => merged.push({ id, score }));
  merged.sort((a, b) => b.score - a.score);
  return options.topN ? merged.slice(0, options.topN) : merged;
}
