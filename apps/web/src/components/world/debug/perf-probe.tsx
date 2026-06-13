"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";

import { writePerf } from "./perf-stats";

interface RendererInfo {
  info?: { render?: { calls?: number; triangles?: number } };
}

/**
 * Samples FPS + draw calls/triangles from the renderer ~4×/s and writes them to
 * the perf store. Lives inside the Canvas. renderer.info may be absent on some
 * WebGPU paths — it degrades to 0 (the overlay shows "—").
 */
export function PerfProbe() {
  const { gl } = useThree();
  const frames = useRef(0);
  const last = useRef(0);

  useFrame(() => {
    frames.current += 1;
    if (last.current === 0) {
      last.current = performance.now();
      return;
    }
    const now = performance.now();
    const elapsed = now - last.current;
    if (elapsed < 250) return;

    const render = (gl as unknown as RendererInfo).info?.render;
    writePerf({
      fps: Math.round((frames.current * 1000) / elapsed),
      calls: render?.calls ?? 0,
      triangles: render?.triangles ?? 0,
    });
    frames.current = 0;
    last.current = now;
  });

  return null;
}
