import { describe, it } from "vitest";

import { runLiveRetrieval } from "./live.js";

describe.runIf(process.env.RUN_LIVE_EVAL === "1")(
  "tier 3 live retrieval",
  () => {
    it("re-embeds the first golden query and hits the expected source", async () => {
      await runLiveRetrieval();
    }, 60_000);
  },
);
