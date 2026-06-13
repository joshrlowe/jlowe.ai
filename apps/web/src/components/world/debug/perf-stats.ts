export interface PerfSample {
  fps: number;
  calls: number;
  triangles: number;
}

// Module singleton: the in-canvas probe writes, the DOM overlay polls. Keeps
// per-frame perf data off React's render path.
const current: PerfSample = { fps: 0, calls: 0, triangles: 0 };

export function writePerf(sample: PerfSample): void {
  current.fps = sample.fps;
  current.calls = sample.calls;
  current.triangles = sample.triangles;
}

export function readPerf(): PerfSample {
  return { ...current };
}
