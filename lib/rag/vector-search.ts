/**
 * Hybrid retrieval over the knowledge_chunks pgvector table.
 *
 * Pipeline:
 *   1. Embed query (Titan).
 *   2. Vector + keyword search in parallel (top-20 each).
 *   3. RRF merge (k = 60, top-20).
 *   4. Hydrate full rows.
 *   5. Optional Cohere rerank to top-K.
 *
 * Each step is wrapped in a Langfuse span when a trace handle is provided
 * (the chat handler passes its parent trace).
 */

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { generateQueryEmbedding } from "./embed";
import { rerankCandidates } from "./rerank";
import { rrfMerge } from "./rrf";
import type { TraceHandle } from "@/lib/observability/langfuse";

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
  trace?: TraceHandle;
}

const HYBRID_TOP_N = 20;

interface SemanticRow {
  id: string;
  semantic_score: number;
}

interface KeywordRow {
  id: string;
  keyword_score: number;
}

function vectorLiteral(embedding: number[]): string {
  // pgvector accepts a string like '[0.1,0.2,...]'.
  return `[${embedding.join(",")}]`;
}

export async function searchKnowledge(
  query: string,
  options: SearchKnowledgeOptions = {}
): Promise<RetrievedChunk[]> {
  const { topK = 5, sourceTypes, trace } = options;
  const trimmed = query.trim();
  if (!trimmed) return [];

  const embedSpan = trace?.span("embedding", { query: trimmed });
  const embedding = await generateQueryEmbedding(trimmed);
  embedSpan?.end({ dims: embedding.length });
  const vec = vectorLiteral(embedding);

  const semSpan = trace?.span("vector_search", { topK: HYBRID_TOP_N });
  const kwSpan = trace?.span("keyword_search", { topK: HYBRID_TOP_N });

  const semanticPromise: Promise<SemanticRow[]> =
    sourceTypes && sourceTypes.length
      ? prisma.$queryRaw<SemanticRow[]>(
          Prisma.sql`
            SELECT id, 1 - (embedding <=> ${vec}::vector) AS semantic_score
            FROM knowledge_chunks
            WHERE embedding IS NOT NULL
              AND "sourceType" = ANY(${sourceTypes}::text[])
            ORDER BY embedding <=> ${vec}::vector
            LIMIT ${HYBRID_TOP_N}
          `
        )
      : prisma.$queryRaw<SemanticRow[]>(
          Prisma.sql`
            SELECT id, 1 - (embedding <=> ${vec}::vector) AS semantic_score
            FROM knowledge_chunks
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> ${vec}::vector
            LIMIT ${HYBRID_TOP_N}
          `
        );

  const keywordPromise: Promise<KeywordRow[]> =
    sourceTypes && sourceTypes.length
      ? prisma.$queryRaw<KeywordRow[]>(
          Prisma.sql`
            SELECT id, ts_rank_cd(tsv, plainto_tsquery('english', ${trimmed})) AS keyword_score
            FROM knowledge_chunks
            WHERE tsv @@ plainto_tsquery('english', ${trimmed})
              AND "sourceType" = ANY(${sourceTypes}::text[])
            ORDER BY keyword_score DESC
            LIMIT ${HYBRID_TOP_N}
          `
        )
      : prisma.$queryRaw<KeywordRow[]>(
          Prisma.sql`
            SELECT id, ts_rank_cd(tsv, plainto_tsquery('english', ${trimmed})) AS keyword_score
            FROM knowledge_chunks
            WHERE tsv @@ plainto_tsquery('english', ${trimmed})
            ORDER BY keyword_score DESC
            LIMIT ${HYBRID_TOP_N}
          `
        );

  const [semantic, keyword] = await Promise.all([
    semanticPromise.then((r) => {
      semSpan?.end({ count: r.length });
      return r;
    }),
    keywordPromise.then((r) => {
      kwSpan?.end({ count: r.length });
      return r;
    }),
  ]);

  const rrfSpan = trace?.span("rrf_merge");
  // Both sides only need {id} for RRF; cast to the common shape.
  const fused = rrfMerge<{ id: string }>(
    [semantic.map((r) => ({ id: r.id })), keyword.map((r) => ({ id: r.id }))],
    { k: 60, topN: HYBRID_TOP_N }
  );
  rrfSpan?.end({ count: fused.length });

  if (fused.length === 0) return [];

  const fusedIds = fused.map((f) => f.id);
  const rows = await prisma.knowledgeChunk.findMany({
    where: { id: { in: fusedIds } },
    select: {
      id: true,
      sourceType: true,
      sourceId: true,
      sourceSlug: true,
      sourceTitle: true,
      headingPath: true,
      content: true,
    },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const rrfScoreById = new Map(fused.map((f) => [f.id, f.score]));

  const ordered: RetrievedChunk[] = fusedIds
    .map((id) => {
      const row = byId.get(id);
      if (!row) return null;
      return {
        id: row.id,
        sourceType: row.sourceType,
        sourceId: row.sourceId,
        sourceSlug: row.sourceSlug,
        sourceTitle: row.sourceTitle,
        headingPath: row.headingPath,
        content: row.content,
        score: rrfScoreById.get(id) ?? 0,
      } satisfies RetrievedChunk;
    })
    .filter((c): c is RetrievedChunk => c !== null);

  const reranked = await rerankCandidates(trimmed, ordered, { trace, topN: topK });
  return reranked.slice(0, topK);
}
