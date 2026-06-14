"use client";

import { useEffect, useState } from "react";

import { BEACON_COUNT } from "../state/beacons";
import { chapterStore, useChapter } from "../state/chapter-store";

/** Intro title card + a driving speedo/beacon counter (DOM, polled at 10Hz). */
export function ChapterHud() {
  const phase = useChapter((s) => s.phase);
  const collected = useChapter((s) => s.collectedBeacons.length);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setSpeed(Math.round(Math.abs(chapterStore.getState().speedKmh))),
      100,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {phase === "intro" ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 flex flex-col items-center gap-2 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-primary">
            Chapter 1
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Ignition</h1>
        </div>
      ) : null}

      {phase === "driving" ? (
        <div className="pointer-events-none absolute bottom-4 right-4 text-right font-mono">
          <div className="text-3xl font-semibold tabular-nums">
            {speed}
            <span className="ml-1 text-xs text-muted-foreground">km/h</span>
          </div>
          <div className="text-xs text-muted-foreground">
            beacons {collected}/{BEACON_COUNT}
          </div>
        </div>
      ) : null}
    </>
  );
}
