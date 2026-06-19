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

/**
 * Per-frame draw-call / triangle count from a monotonically-accumulating
 * `renderer.info` counter. The PostFX RenderPipeline never resets
 * `renderer.info`, so its totals climb every frame; the per-frame value is the
 * delta against the previous sample. A negative delta means the counter was
 * reset between samples, so the current total is itself the latest frame.
 */
export function frameDelta(current: number, previous: number): number {
  const delta = current - previous;
  return delta >= 0 ? delta : current;
}
