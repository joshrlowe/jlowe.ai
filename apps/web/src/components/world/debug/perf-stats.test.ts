import { describe, expect, it } from "vitest";

import { readPerf, writePerf } from "./perf-stats";

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
