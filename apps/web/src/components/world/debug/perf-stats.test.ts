import { describe, expect, it } from "vitest";

import { frameDelta, readPerf, writePerf } from "./perf-stats";

describe("perf-stats store", () => {
  it("round-trips the latest sample", () => {
    writePerf({ fps: 60, calls: 42, triangles: 12000 });
    expect(readPerf()).toEqual({ fps: 60, calls: 42, triangles: 12000 });
  });

  it("returns a copy, not the live object", () => {
    writePerf({ fps: 30, calls: 10, triangles: 500 });
    const a = readPerf();
    a.fps = 0;
    expect(readPerf().fps).toBe(30);
  });
});

describe("frameDelta", () => {
  it("returns the per-frame delta of an accumulating counter", () => {
    // RenderPipeline never resets info → totals climb; the per-frame draw
    // count is the difference between consecutive samples.
    expect(frameDelta(12450, 12388)).toBe(62);
  });

  it("treats a counter reset (negative delta) as the latest frame", () => {
    expect(frameDelta(63, 50000)).toBe(63);
  });

  it("is zero when the counter did not advance", () => {
    expect(frameDelta(900, 900)).toBe(0);
  });
});
