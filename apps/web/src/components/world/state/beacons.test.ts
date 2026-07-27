import { describe, expect, it } from "vitest";

import { CORPUS } from "@/data/corpus.generated";

import { BEACON_COUNT, BEACONS } from "./beacons";

// The list is empty while no chapter is registered (the circuit set retired
// with the driving world). These invariants are vacuous today but guard the
// shape the moment Chapter 2 rebinds slugs to its rail.
describe("beacons", () => {
  it("keeps the count constant in lockstep with the list", () => {
    expect(BEACON_COUNT).toBe(BEACONS.length);
  });

  it("binds every beacon to an existing public corpus entry", () => {
    for (const b of BEACONS) {
      expect(CORPUS[b.slug], `corpus missing slug "${b.slug}"`).toBeDefined();
    }
  });

  it("places each beacon on the curve (t in 0..1)", () => {
    for (const b of BEACONS) {
      expect(b.t).toBeGreaterThanOrEqual(0);
      expect(b.t).toBeLessThanOrEqual(1);
    }
  });

  it("has unique slugs", () => {
    const slugs = BEACONS.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(BEACON_COUNT);
  });
});
