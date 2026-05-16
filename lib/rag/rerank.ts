/**
 * Cohere Rerank wrapper. Fetch-based, no SDK.
 *
 * Fail-open: when COHERE_API_KEY is missing or the call errors, returns the
 * input unchanged. Wraps the call in a Langfuse span when a trace handle is
 * provided.
 */

import type { TraceHandle } from "@/lib/observability/langfuse";

const COHERE_URL = "https://api.cohere.com/v2/rerank";
const RERANK_MODEL = "rerank-english-v3.0";

export interface RerankableChunk {
  content: string;
  score: number;
}

export interface RerankOptions {
  topN?: number;
  trace?: TraceHandle;
}

export async function rerankCandidates<T extends RerankableChunk>(
  query: string,
  candidates: T[],
  options: RerankOptions = {}
): Promise<(T & { rerankScore?: number })[]> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey || candidates.length === 0) {
    return candidates;
  }
  const span = options.trace?.span("cohere_rerank", { count: candidates.length });
  try {
    const res = await fetch(COHERE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: RERANK_MODEL,
        query,
        documents: candidates.map((c) => c.content),
        top_n: options.topN ?? candidates.length,
      }),
    });
    if (!res.ok) {
      console.warn(`[rerank] Cohere returned ${res.status}; falling back to RRF order`);
      span?.end({ ok: false, status: res.status });
      return candidates;
    }
    const data = (await res.json()) as {
      results: Array<{ index: number; relevance_score: number }>;
    };
    span?.end({ ok: true, count: data.results.length });
    return data.results.map((r) => ({
      ...candidates[r.index],
      rerankScore: r.relevance_score,
      score: r.relevance_score,
    }));
  } catch (err) {
    console.warn("[rerank] failed:", (err as Error).message);
    span?.end({ ok: false, error: (err as Error).message });
    return candidates;
  }
}
