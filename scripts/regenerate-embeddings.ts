/**
 * Trigger an Inngest knowledge/reindex.requested event.
 *
 * The Inngest function fans out one scoped event per source so each source
 * re-embeds in parallel (within the function's concurrency budget).
 *
 * Local dev: requires `npm run jobs:dev` to be running so the Inngest dev
 * server can pick up the event and invoke the registered function. The
 * dashboard at http://localhost:8288 shows progress.
 *
 * Production: emits straight to Inngest Cloud via INNGEST_EVENT_KEY.
 */

import "dotenv/config";
import { inngest } from "../lib/jobs/client";

async function main() {
  console.log("Emitting knowledge/reindex.requested (full reindex)...");
  const result = await inngest.send({
    name: "knowledge/reindex.requested",
    data: {},
  });
  console.log(`  → event id(s): ${result.ids.join(", ")}`);
  console.log("");
  console.log("Watch progress at:");
  console.log("  http://localhost:8288/runs   (local dev)");
  console.log("  https://app.inngest.com      (production)");
}

main().catch((err) => {
  console.error("Failed to emit reindex event:", err);
  console.error("");
  console.error("If running locally, make sure `npm run jobs:dev` is up.");
  console.error("If running in CI/prod, ensure INNGEST_EVENT_KEY is set.");
  process.exit(1);
});
