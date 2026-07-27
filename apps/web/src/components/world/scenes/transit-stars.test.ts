import { describe, expect, it } from "vitest";

import { buildStarfield, mulberry32 } from "./transit-stars";

describe("mulberry32", () => {
  it("is deterministic for a seed and uniform in [0, 1)", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("produces different streams for different seeds", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe("buildStarfield", () => {
  it("emits count xyz/rgb triples", () => {
    const { positions, colors } = buildStarfield(50, 1);
    expect(positions).toHaveLength(150);
    expect(colors).toHaveLength(150);
  });

  it("is deterministic for a seed (no runtime Math.random)", () => {
    const a = buildStarfield(64, 42);
    const b = buildStarfield(64, 42);
    expect(a.positions).toEqual(b.positions);
    expect(a.colors).toEqual(b.colors);
  });

  it("keeps every star on the requested shell", () => {
    const min = 60;
    const max = 140;
    const { positions } = buildStarfield(200, 3, min, max);
    for (let i = 0; i < positions.length; i += 3) {
      const r = Math.hypot(
        positions[i] ?? 0,
        positions[i + 1] ?? 0,
        positions[i + 2] ?? 0,
      );
      expect(r).toBeGreaterThanOrEqual(min - 1e-9);
      expect(r).toBeLessThanOrEqual(max + 1e-9);
    }
  });

  it("keeps colours in 0..1", () => {
    const { colors } = buildStarfield(200, 9);
    for (const c of colors) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
  });
});
