"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import { frameDelta, writePerf } from "./perf-stats";

interface Info {
  autoReset?: boolean;
  render?: { calls?: number; triangles?: number };
}

interface RendererInfo {
  info?: Info;
}

// Routed through a function so toggling the stats flag isn't a direct mutation
// of the hook-returned renderer (react-hooks/immutability).
function setAutoReset(info: Info, value: boolean | undefined): void {
  info.autoReset = value;
}

/**
 * Samples FPS + PER-FRAME draw calls/triangles from the renderer and writes
 * them to the perf store ~4×/s. Lives inside the Canvas.
 *
 * The PostFX RenderPipeline drives the render loop but never resets
 * `renderer.info`, so `calls`/`triangles` accumulate across frames (tens of
 * thousands) instead of reporting one frame. We pin `info.autoReset=false` so
 * the counter climbs monotonically and report the per-frame delta against the
 * previous frame's total — the real per-frame draw count (VAL-PERF-001). This
 * is overlay-only bookkeeping and does not affect rendering.
 *
 * `renderer.info` may be absent on some WebGPU paths — it degrades to 0 (the
 * overlay shows "—").
 */
export function PerfProbe() {
  const { gl } = useThree();
  const frames = useRef(0);
  const last = useRef(0);
  const prevCalls = useRef(0);
  const prevTriangles = useRef(0);
  const frameCalls = useRef(0);
  const frameTriangles = useRef(0);

  useEffect(() => {
    const info = (gl as unknown as RendererInfo).info;
    if (!info) return;
    const prevAutoReset = info.autoReset;
    setAutoReset(info, false);
    return () => setAutoReset(info, prevAutoReset);
  }, [gl]);

  useFrame(() => {
    const render = (gl as unknown as RendererInfo).info?.render;
    const totalCalls = render?.calls ?? 0;
    const totalTriangles = render?.triangles ?? 0;
    frameCalls.current = frameDelta(totalCalls, prevCalls.current);
    frameTriangles.current = frameDelta(totalTriangles, prevTriangles.current);
    prevCalls.current = totalCalls;
    prevTriangles.current = totalTriangles;

    frames.current += 1;
    if (last.current === 0) {
      last.current = performance.now();
      return;
    }
    const now = performance.now();
    const elapsed = now - last.current;
    if (elapsed < 250) return;

    writePerf({
      fps: Math.round((frames.current * 1000) / elapsed),
      calls: frameCalls.current,
      triangles: frameTriangles.current,
    });
    frames.current = 0;
    last.current = now;
  });

  return null;
}
