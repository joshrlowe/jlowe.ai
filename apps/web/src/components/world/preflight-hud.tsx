"use client";

import { useProgress } from "@react-three/drei";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { latchProgress, loadingLabel } from "./preflight-progress";

/**
 * Diegetic "pre-flight systems check" loader — a DOM overlay (outside the
 * Canvas) reading drei's useProgress, which tracks the real DefaultLoading
 * manager. No fake bars; the 2D site is one tap away at all times.
 */
export function PreflightHud() {
  const { active, progress, item, loaded, total } = useProgress();
  // Monotonic latch via the React-blessed "adjust state during render" pattern
  // (it bails on equal values, so no loop) — avoids ref access during render.
  const [maxSeen, setMaxSeen] = useState(0);
  const latched = latchProgress(maxSeen, progress);
  if (latched !== maxSeen) setMaxSeen(latched);
  // A fully procedural scene loads nothing through the manager (total stays 0),
  // so "nothing to load" reads as ready rather than stuck at 0%.
  const shown = total === 0 ? 100 : Math.round(latched);

  const [done, setDone] = useState(false);
  useEffect(() => {
    // Hide once the loading manager is idle. Covers procedural scenes (0 assets,
    // progress never reaches 100) as well as asset scenes (active flips false
    // when loads finish). The settle guards a scene that starts loading a frame
    // later.
    if (active) return;
    const timer = setTimeout(() => setDone(true), 600);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <div
      aria-hidden={done}
      className={cn(
        "pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur transition-opacity duration-700",
        done && "opacity-0",
      )}
    >
      <div className="w-full max-w-sm px-6 font-mono">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">
          Pre-flight systems check
        </p>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${shown}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">
            {total === 0 ? "ready" : loadingLabel(item)}
          </span>
          <span>{shown}%</span>
        </div>
        {total > 0 ? (
          <p className="mt-1 text-[10px] text-muted-foreground">
            {loaded}/{total} assets
          </p>
        ) : null}
      </div>

      <Link
        href="/"
        className="pointer-events-auto mt-10 text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
      >
        Skip to the 2D site →
      </Link>
    </div>
  );
}
