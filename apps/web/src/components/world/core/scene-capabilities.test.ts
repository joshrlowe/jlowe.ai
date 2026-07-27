import { describe, expect, it } from "vitest";

import { sceneSupportsUltraPostFX } from "./scene-capabilities";

describe("sceneSupportsUltraPostFX", () => {
  it("keeps every current scene on the floor (no scene opts in today)", () => {
    // The hero vignette — the only opted-in scene — retired with the driving
    // world; transit/fixture never opt in.
    for (const scene of ["transit", "fixture", "hero", "circuit"]) {
      expect(sceneSupportsUltraPostFX(scene)).toBe(false);
    }
  });

  it("returns false for unknown scene keys", () => {
    expect(sceneSupportsUltraPostFX("does-not-exist")).toBe(false);
    expect(sceneSupportsUltraPostFX("")).toBe(false);
  });

  it("returns false for prototype-chain keys (no `in`-style leak)", () => {
    for (const key of [
      "__proto__",
      "constructor",
      "toString",
      "hasOwnProperty",
    ]) {
      expect(sceneSupportsUltraPostFX(key)).toBe(false);
    }
  });
});
