#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildIndex, renderIndexModule } from "./build-index.js";
import { generateQueryEmbedding } from "./embed.js";
import {
  applyEmbeddings,
  embedMissingChunks,
  embeddingsByHash,
} from "./embeddings.js";
import { checkFreshness } from "./freshness.js";
import { CORPUS_INDEX } from "./index.generated.js";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, "..");
const repoRoot = join(packageRoot, "..", "..");
const generated = join(packageRoot, "src", "index.generated.ts");

const cmd = process.argv[2] ?? "write";

if (cmd === "check") {
  const result = checkFreshness(
    repoRoot,
    CORPUS_INDEX.chunks.map((c) => c.contentHash),
  );
  if (!result.ok) {
    console.error(result.message);
    process.exit(1);
  }
  console.log(result.message);
  process.exit(0);
}

if (cmd !== "write") {
  console.error(`usage: corpus-index <write|check>`);
  process.exit(2);
}

async function writeIndex(): Promise<void> {
  const index = buildIndex(repoRoot);
  const previous = embeddingsByHash(CORPUS_INDEX.chunks);
  const { byHash, embedded, reused, omitted, awsFailed } =
    await embedMissingChunks(index.chunks, previous, generateQueryEmbedding);
  const chunks = applyEmbeddings(index.chunks, byHash);
  mkdirSync(dirname(generated), { recursive: true });
  writeFileSync(generated, renderIndexModule({ ...index, chunks }));
  console.log(
    `corpus-index: ${chunks.length} chunks from public corpus → packages/corpus-index/src/index.generated.ts`,
  );
  console.log(
    `  embeddings: ${reused} reused, ${embedded} embedded, ${omitted} omitted${
      awsFailed ? " (AWS unavailable)" : ""
    }`,
  );
}

try {
  await writeIndex();
} catch (error) {
  console.error(error);
  process.exit(1);
}
