import { describe, it } from "vitest";

import { runLiveProbes } from "./eval-live.js";

describe.runIf(process.env.RUN_LIVE_EVAL === "1")(
  "tier 3 live model probes",
  () => {
    it("refuses invented Google founding and cites Jarvis on exported paths", async () => {
      await runLiveProbes();
    }, 120_000);
  },
);
