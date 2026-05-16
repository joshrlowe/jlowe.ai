/**
 * Single-source upsert for the knowledge index.
 *
 * Shared by the Inngest function (event-driven, per source) and the legacy
 * synchronous script (loops over loadAllSources). Encapsulates:
 *   - chunking
 *   - SHA-256 content-hash gate (skip when nothing changed)
 *   - rate-limited embedding with retry/backoff
 *   - atomic delete + insert via prisma.$transaction
 */

import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { chunkMarkdown } from "@/lib/rag/chunker";
import { generateQueryEmbedding } from "@/lib/rag/embed";
import {
  formatAboutSource,
  formatArticleSource,
  formatContactSource,
  formatProjectSource,
  formatWelcomeSource,
  type KnowledgeSource,
  type KnowledgeSourceType,
} from "@/lib/rag/sources";

const RATE_LIMIT_DELAY_MS = 200;
const MAX_RETRIES = 3;

export type UpsertAction = "skip" | "insert" | "update" | "empty";

export interface UpsertResult {
  action: UpsertAction;
  sourceType: KnowledgeSourceType;
  sourceId: string;
  chunkCount: number;
  embedCalls: number;
}

const SINGLETON_TYPES = new Set<KnowledgeSourceType>([
  "about",
  "welcome",
  "contact",
]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function vectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

async function embedWithRetry(text: string): Promise<number[]> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await generateQueryEmbedding(text);
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw err;
      const delay = 1000 * 2 ** attempt;
      console.warn(
        `[upsert] embed retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms: ${(err as Error).message}`,
      );
      await sleep(delay);
    }
  }
  throw new Error("Unreachable");
}

/**
 * Load one source ready for chunking. Returns `null` when the source either
 * doesn't exist or is currently filtered out (e.g. a Draft post or Draft
 * project — the public RAG index never includes drafts).
 */
export async function loadOneSource(
  sourceType: KnowledgeSourceType,
  sourceId?: string,
): Promise<KnowledgeSource | null> {
  switch (sourceType) {
    case "article": {
      if (!sourceId) return null;
      const post = await prisma.post.findUnique({ where: { id: sourceId } });
      if (!post || post.status !== "Published") return null;
      return formatArticleSource(post);
    }
    case "project": {
      if (!sourceId) return null;
      const project = await prisma.project.findUnique({ where: { id: sourceId } });
      if (!project || project.status === "Draft") return null;
      return formatProjectSource(project);
    }
    case "about": {
      const about = await prisma.about.findFirst({
        orderBy: { updatedAt: "desc" },
      });
      return about ? formatAboutSource(about) : null;
    }
    case "welcome": {
      const welcome = await prisma.welcome.findFirst({
        orderBy: { updatedAt: "desc" },
      });
      return welcome ? formatWelcomeSource(welcome) : null;
    }
    case "contact": {
      const contact = await prisma.contact.findFirst({
        orderBy: { updatedAt: "desc" },
      });
      return contact ? formatContactSource(contact) : null;
    }
  }
}

/**
 * Delete every chunk for a specific (sourceType, sourceId) pair.
 */
export async function deleteSourceChunks(
  sourceType: KnowledgeSourceType,
  sourceId: string,
): Promise<{ deleted: number }> {
  const result = await prisma.knowledgeChunk.deleteMany({
    where: { sourceType, sourceId },
  });
  return { deleted: result.count };
}

/**
 * Delete every chunk for a singleton sourceType, regardless of sourceId.
 *
 * About / Welcome / Contact are written via deleteMany + create which
 * generates a fresh row id every time. Without this sweep, chunks for
 * superseded ids would linger and pollute vector search.
 */
export async function sweepSingletonChunks(
  sourceType: "about" | "welcome" | "contact",
): Promise<{ deleted: number }> {
  const result = await prisma.knowledgeChunk.deleteMany({
    where: { sourceType },
  });
  return { deleted: result.count };
}

/**
 * Chunk + embed + atomic-replace a single source's chunks. Idempotent:
 * if the source's chunk hashes already match what's in the DB, skip.
 */
export async function upsertSourceChunks(
  source: KnowledgeSource,
): Promise<UpsertResult> {
  const chunks = chunkMarkdown(source.markdown);

  if (chunks.length === 0) {
    // Source has no embeddable content. Clear any stale chunks so search
    // doesn't return them.
    if (SINGLETON_TYPES.has(source.sourceType)) {
      await sweepSingletonChunks(
        source.sourceType as "about" | "welcome" | "contact",
      );
    } else {
      await deleteSourceChunks(source.sourceType, source.sourceId);
    }
    return {
      action: "empty",
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      chunkCount: 0,
      embedCalls: 0,
    };
  }

  const expectedHashes = chunks.map((c) => hashContent(c.content));

  const existing = await prisma.knowledgeChunk.findMany({
    where: { sourceType: source.sourceType, sourceId: source.sourceId },
    select: { chunkIndex: true, contentHash: true },
    orderBy: { chunkIndex: "asc" },
  });

  const allMatch =
    existing.length === chunks.length &&
    existing.every((e, i) => e.contentHash === expectedHashes[i]);

  if (allMatch) {
    return {
      action: "skip",
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      chunkCount: chunks.length,
      embedCalls: 0,
    };
  }

  const isUpdate = existing.length > 0;

  // Embed outside the transaction so we don't hold a long DB lock during
  // slow Bedrock calls.
  const embeddings: number[][] = [];
  for (let i = 0; i < chunks.length; i++) {
    embeddings.push(await embedWithRetry(chunks[i].content));
    if (i < chunks.length - 1) await sleep(RATE_LIMIT_DELAY_MS);
  }

  await prisma.$transaction(async (tx) => {
    await tx.knowledgeChunk.deleteMany({
      where: { sourceType: source.sourceType, sourceId: source.sourceId },
    });
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO knowledge_chunks
            (id, "sourceType", "sourceId", "sourceSlug", "sourceTitle",
             "headingPath", content, "contentHash", "tokenCount",
             "chunkIndex", embedding, "createdAt", "updatedAt")
          VALUES
            (${randomUUID()}, ${source.sourceType}, ${source.sourceId},
             ${source.sourceSlug}, ${source.sourceTitle},
             ${chunk.headingPath}::text[], ${chunk.content},
             ${expectedHashes[i]}, ${chunk.tokenCount}, ${i},
             ${vectorLiteral(embeddings[i])}::vector,
             NOW(), NOW())
        `,
      );
    }
  });

  return {
    action: isUpdate ? "update" : "insert",
    sourceType: source.sourceType,
    sourceId: source.sourceId,
    chunkCount: chunks.length,
    embedCalls: chunks.length,
  };
}
