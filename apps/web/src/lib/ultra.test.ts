import { describe, expect, it } from "vitest";

import {
  parseQualityOverride,
  selectExplicitUltra,
  selectIsUltra,
  type UltraSignals,
} from "./ultra";

/** A strong WebGPU desktop with a confirmed adapter and ample memory. */
function strongGpu(overrides: Partial<UltraSignals> = {}): UltraSignals {
  return {
    tier: "webgpu",
    override: null,
    adapterConfirmed: true,
    deviceMemory: 8,
    ...overrides,
  };
}

describe("parseQualityOverride", () => {
  it.each(["ultra", "high", "standard"] as const)(
    "parses ?quality=%s",
    (value) => {
      expect(parseQualityOverride(`?quality=${value}`)).toBe(value);
    },
  );

  it("returns null when ?quality is absent", () => {
    expect(parseQualityOverride("")).toBeNull();
    expect(parseQualityOverride("?scene=hero")).toBeNull();
  });

  it("returns null for an unknown ?quality value", () => {
    expect(parseQualityOverride("?quality=potato")).toBeNull();
    expect(parseQualityOverride("?quality=")).toBeNull();
  });
});

describe("selectIsUltra", () => {
  it("auto-ON: webgpu + adapter present + deviceMemory>=8", () => {
    expect(selectIsUltra(strongGpu())).toBe(true);
    expect(selectIsUltra(strongGpu({ deviceMemory: 16 }))).toBe(true);
  });

  it("auto-OFF: deviceMemory below the strong-GPU threshold", () => {
    expect(selectIsUltra(strongGpu({ deviceMemory: 4 }))).toBe(false);
    expect(selectIsUltra(strongGpu({ deviceMemory: 7 }))).toBe(false);
  });

  it("auto-OFF: adapter not confirmed (absent or unknown)", () => {
    expect(selectIsUltra(strongGpu({ adapterConfirmed: false }))).toBe(false);
    expect(selectIsUltra(strongGpu({ adapterConfirmed: null }))).toBe(false);
  });

  it("auto-OFF: unknown deviceMemory", () => {
    expect(selectIsUltra(strongGpu({ deviceMemory: null }))).toBe(false);
  });

  it("override ?quality=ultra wins over a declining heuristic", () => {
    expect(
      selectIsUltra(
        strongGpu({
          override: "ultra",
          deviceMemory: 2,
          adapterConfirmed: null,
        }),
      ),
    ).toBe(true);
  });

  it("override ?quality=high/standard wins over a passing heuristic", () => {
    expect(selectIsUltra(strongGpu({ override: "high" }))).toBe(false);
    expect(selectIsUltra(strongGpu({ override: "standard" }))).toBe(false);
  });

  it("webgl never selects ultra (heuristic or override)", () => {
    expect(selectIsUltra(strongGpu({ tier: "webgl" }))).toBe(false);
    expect(selectIsUltra(strongGpu({ tier: "webgl", override: "ultra" }))).toBe(
      false,
    );
  });

  it("2d never selects ultra (heuristic or override)", () => {
    expect(selectIsUltra(strongGpu({ tier: "2d" }))).toBe(false);
    expect(selectIsUltra(strongGpu({ tier: "2d", override: "ultra" }))).toBe(
      false,
    );
  });
});

describe("selectExplicitUltra", () => {
  it("ON only when ultra is active AND ?quality=ultra was explicit", () => {
    expect(selectExplicitUltra(true, "ultra")).toBe(true);
  });

  it("OFF for the strong-GPU auto-heuristic (ultra active, no override)", () => {
    // The key case: a capable visitor lands on the reliable floor by default,
    // not the heavy cinematic stack.
    expect(selectExplicitUltra(true, null)).toBe(false);
  });

  it("OFF when ultra is not active, even with ?quality=ultra", () => {
    // e.g. webgl/2d tier where selectIsUltra already returned false.
    expect(selectExplicitUltra(false, "ultra")).toBe(false);
  });

  it("OFF for non-ultra overrides", () => {
    expect(selectExplicitUltra(true, "high")).toBe(false);
    expect(selectExplicitUltra(true, "standard")).toBe(false);
  });
});
