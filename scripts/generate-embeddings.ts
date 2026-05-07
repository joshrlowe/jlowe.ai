/**
 * Build + embed knowledge base into Postgres (knowledge_chunks).
 *
 * Idempotent: per source, computes SHA-256 hashes for each chunk and skips
 * the source entirely if every chunk already in the DB matches. Otherwise,
 * deletes the source's chunks and re-inserts in a single transaction with
 * fresh embeddings.
 *
 * Replaces the old two-step build:knowledge-base + build:embeddings flow.
 */

import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { loadAllSources } from "../lib/rag/sources";
import { chunkMarkdown } from "../lib/rag/chunker";
import { generateQueryEmbedding } from "../lib/rag/embed";

const RATE_LIMIT_DELAY_MS = 200;
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function embedWithRetry(text: string): Promise<number[]> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await generateQueryEmbedding(text);
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw err;
      const delay = 1000 * 2 ** attempt;
      console.warn(
        `  Retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms: ${(err as Error).message}`,
      );
      await sleep(delay);
    }
  }
  throw new Error("Unreachable");
}

function vectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

async function main() {
  console.log("Loading sources from Postgres...");
  const sources = await loadAllSources();
  console.log(`  → ${sources.length} sources loaded\n`);

  let added = 0;
  let updated = 0;
  let unchanged = 0;
  let embedCalls = 0;

  for (const source of sources) {
    const chunks = chunkMarkdown(source.markdown);
    if (chunks.length === 0) {
      console.log(`[skip] ${source.sourceType}/${source.sourceTitle} → no chunks (empty/short content)`);
      continue;
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
      unchanged += chunks.length;
      console.log(
        `[unchanged] ${source.sourceType}/${source.sourceTitle} → ${chunks.length} chunks`,
      );
      continue;
    }

    const isUpdate = existing.length > 0;
    console.log(
      `[${isUpdate ? "update" : "insert"}] ${source.sourceType}/${source.sourceTitle} → ${chunks.length} chunks (${chunks.length} embeddings)`,
    );

    // Embed all chunks first (rate-limited). Outside the transaction so we
    // don't hold a long DB lock during slow Bedrock calls.
    const embeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i++) {
      embeddings.push(await embedWithRetry(chunks[i].content));
      embedCalls++;
      if (i < chunks.length - 1) await sleep(RATE_LIMIT_DELAY_MS);
    }

    // Atomic replace.
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

    if (isUpdate) updated += chunks.length;
    else added += chunks.length;
  }

  console.log("\n--- Summary ---");
  console.log(`Sources processed: ${sources.length}`);
  console.log(`Chunks added:      ${added}`);
  console.log(`Chunks updated:    ${updated}`);
  console.log(`Chunks unchanged:  ${unchanged}`);
  console.log(`Embedding calls:   ${embedCalls}`);
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
