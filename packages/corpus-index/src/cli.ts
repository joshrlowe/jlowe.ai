#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildIndex, renderIndexModule } from "./build-index.js";
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

const index = buildIndex(repoRoot);
mkdirSync(dirname(generated), { recursive: true });
writeFileSync(generated, renderIndexModule(index));
console.log(
  `corpus-index: ${index.chunks.length} chunks from public corpus → packages/corpus-index/src/index.generated.ts`,
);
