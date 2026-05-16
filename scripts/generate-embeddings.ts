/**
 * Legacy synchronous embedding regeneration. Kept available behind
 * `npm run build:embeddings:legacy`. Loops over every source and calls
 * the shared upsert path.
 *
 * For event-driven incremental updates, use `npm run build:embeddings`,
 * which emits an Inngest reindex event instead.
 */

import "dotenv/config";
import prisma from "../lib/prisma";
import { loadAllSources } from "../lib/rag/sources";
import { upsertSourceChunks } from "../lib/rag/upsert";

async function main() {
  console.log("Loading sources from Postgres...");
  const sources = await loadAllSources();
  console.log(`  → ${sources.length} sources loaded\n`);

  let added = 0;
  let updated = 0;
  let unchanged = 0;
  let empty = 0;
  let embedCalls = 0;

  for (const source of sources) {
    const result = await upsertSourceChunks(source);
    embedCalls += result.embedCalls;
    switch (result.action) {
      case "insert":
        added += result.chunkCount;
        console.log(
          `[insert] ${source.sourceType}/${source.sourceTitle} → ${result.chunkCount} chunks`,
        );
        break;
      case "update":
        updated += result.chunkCount;
        console.log(
          `[update] ${source.sourceType}/${source.sourceTitle} → ${result.chunkCount} chunks`,
        );
        break;
      case "skip":
        unchanged += result.chunkCount;
        console.log(
          `[unchanged] ${source.sourceType}/${source.sourceTitle} → ${result.chunkCount} chunks`,
        );
        break;
      case "empty":
        empty++;
        console.log(
          `[skip] ${source.sourceType}/${source.sourceTitle} → no chunks (empty/short content)`,
        );
        break;
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Sources processed: ${sources.length}`);
  console.log(`Chunks added:      ${added}`);
  console.log(`Chunks updated:    ${updated}`);
  console.log(`Chunks unchanged:  ${unchanged}`);
  console.log(`Empty sources:     ${empty}`);
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
