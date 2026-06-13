import { describe, expect, it } from "vitest";

import { PIPELINE_VERSION, run } from "./index.js";

describe("asset-pipeline", () => {
  it("is a no-op in phase 0 and reports its version", () => {
    expect(run([])).toEqual({ status: "noop", version: PIPELINE_VERSION });
  });
});
