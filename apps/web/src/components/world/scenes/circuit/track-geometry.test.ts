import { describe, expect, it } from "vitest";

import { buildTrack, CIRCUIT_POINTS, trackSpawn } from "./track-geometry";

describe("buildTrack", () => {
  it("sweeps a closed ribbon with the expected vertex/index counts", () => {
    const segments = 40;
    const { geometry, curve } = buildTrack(CIRCUIT_POINTS, 5, segments);
    expect(curve.closed).toBe(true);
    // two edge vertices per sample, (segments + 1) samples
    expect(geometry.getAttribute("position").count).toBe((segments + 1) * 2);
    expect(geometry.getIndex()?.count).toBe(segments * 6);
    expect(geometry.getAttribute("color").count).toBe((segments + 1) * 2);
  });

  it("spawns on the curve start, 1.2 above it", () => {
    const { curve } = buildTrack();
    const spawn = trackSpawn(curve);
    const start = curve.getPointAt(0);
    expect(spawn.position[0]).toBeCloseTo(start.x);
    expect(spawn.position[1]).toBeCloseTo(start.y + 1.2);
    expect(Number.isFinite(spawn.heading)).toBe(true);
  });
});
