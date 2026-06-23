"use client";

import { useProgress } from "@react-three/drei";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { queueTwoDNotice } from "@/lib/two-d-notice";
import { cn } from "@/lib/utils";

import { latchProgress, loadingLabel } from "./preflight-progress";

// Progress hasn't advanced for this long while the loader is still up → treat
// the load as hung (an asset/decoder that neither resolved nor errored, so the
// manager never goes idle) and fall forward to the 2D site. Generous enough not
// to bail a slow-but-working download — manager progress is flat for the whole
// of a single in-flight item — but a hard ceiling on the "stuck forever" the
// loader used to allow.
const STALL_TIMEOUT_MS = 20_000;

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

  // Stall watchdog. The loader hides only when the manager goes idle, so a hung
  // load (an asset/decoder that never resolves AND never errors — e.g. a Draco
  // worker the CSP blocks) would pin it forever. If progress stops advancing for
  // STALL_TIMEOUT_MS, fall forward to the 2D site. A stable 1s interval polls a
  // last-advance timestamp ref, so nothing — re-render churn, a fluctuating
  // asset total, an unstable router — can perpetually reset or defeat it; the
  // hard navigation is router-independent on purpose.
  // NOTE (P5): once the arrival lives on "/", revisit this target so a stall on
  // the home route dismisses the 3D layer instead of self-navigating.
  const bailed = useRef(false);
  const lastAdvance = useRef(0);
  useEffect(() => {
    lastAdvance.current = Date.now();
  }, [maxSeen]);
  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      if (bailed.current) return;
      if (Date.now() - lastAdvance.current > STALL_TIMEOUT_MS) {
        bailed.current = true;
        window.clearInterval(id);
        queueTwoDNotice();
        window.location.assign("/");
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

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
