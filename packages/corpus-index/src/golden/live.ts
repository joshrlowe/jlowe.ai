/**
 * Tier 3 live retrieval. Requires AWS creds (nightly OIDC). Never run on
 * pull_request — this file is invoked by `.github/workflows/eval-nightly.yml`.
 *
 * Re-embeds the first golden query with Titan and asserts the expected
 * source is still in the top-5. Drift here means the committed vectors or
 * the live model no longer agree with the corpus.
 */

import { searchKnowledge } from "../search.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

interface GoldenFile {
  queries: Array<{ id: string; query: string; expectedSourceIds: string[] }>;
}

const dir = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(
  readFileSync(join(dir, "queries.json"), "utf8"),
) as GoldenFile;
const first = golden.queries[0];
if (!first) {
  throw new Error("golden queries.json is empty");
}

const hits = await searchKnowledge(first.query, { topK: 5 });
const ids = hits.map((h) => h.sourceId);
const ok = first.expectedSourceIds.some((id) => ids.includes(id));
if (!ok) {
  console.error(
    JSON.stringify({
      level: "error",
      msg: "live_retrieval_miss",
      query: first.query,
      expected: first.expectedSourceIds,
      got: ids,
    }),
  );
  process.exit(1);
}
console.log(
  JSON.stringify({
    level: "info",
    msg: "live_retrieval_ok",
    query: first.query,
    topSourceIds: ids,
  }),
);
