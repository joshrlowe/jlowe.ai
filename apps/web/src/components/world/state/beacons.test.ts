import { describe, expect, it } from "vitest";

import { CORPUS } from "@/data/corpus.generated";

import { BEACON_COUNT, BEACONS } from "./beacons";

describe("beacons", () => {
  it("binds every beacon to an existing public corpus entry", () => {
    for (const b of BEACONS) {
      expect(CORPUS[b.slug], `corpus missing slug "${b.slug}"`).toBeDefined();
    }
  });

  it("places each beacon on the curve and clear of the pit (t≈0.5)", () => {
    for (const b of BEACONS) {
      expect(b.t).toBeGreaterThanOrEqual(0);
      expect(b.t).toBeLessThanOrEqual(1);
      expect(Math.abs(b.t - 0.5)).toBeGreaterThan(0.05);
    }
  });

  it("has unique slugs", () => {
    const slugs = BEACONS.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(BEACON_COUNT);
  });
});
