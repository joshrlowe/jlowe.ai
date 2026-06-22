import { describe, expect, it } from "vitest";

import { sceneSupportsUltraPostFX } from "./scene-capabilities";

describe("sceneSupportsUltraPostFX", () => {
  it("opts the hero scene into the ultra post-FX branch", () => {
    expect(sceneSupportsUltraPostFX("hero")).toBe(true);
  });

  it("keeps the existing scenes on the floor (no ultra post-FX)", () => {
    for (const scene of ["circuit", "proving-ground", "fixture"]) {
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
