import { describe, expect, it } from "vitest";

import { latchProgress, loadingLabel } from "./preflight-progress";

describe("latchProgress", () => {
  it("advances forward", () => {
    expect(latchProgress(20, 55)).toBe(55);
  });
  it("never regresses", () => {
    expect(latchProgress(80, 30)).toBe(80);
  });
});

describe("loadingLabel", () => {
  it("falls back when no item is loading", () => {
    expect(loadingLabel(undefined)).toBe("initializing renderer");
  });
  it("shows the basename of the current asset", () => {
    expect(loadingLabel("/assets/vehicle.abc123.glb")).toBe(
      "loading vehicle.abc123.glb",
    );
  });
});
