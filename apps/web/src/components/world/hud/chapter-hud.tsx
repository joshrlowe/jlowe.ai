"use client";

import { useEffect, useState } from "react";

import { chapterStore, useChapter } from "../state/chapter-store";
import { chapterById } from "../state/chapters";

/** Intro title card + a driving speedo/beacon counter (DOM, polled at 10Hz). */
export function ChapterHud() {
  const phase = useChapter((s) => s.phase);
  const activeChapterId = useChapter((s) => s.activeChapterId);
  const collected = useChapter((s) => s.collectedBeacons.length);
  const [speed, setSpeed] = useState(0);

  const chapter = chapterById(activeChapterId);
  const beaconCount = chapter?.beacons.length ?? 0;

  useEffect(() => {
    const id = setInterval(
      () => setSpeed(Math.round(Math.abs(chapterStore.getState().speedKmh))),
      100,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {phase === "intro" && chapter ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 flex flex-col items-center gap-2 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-primary">
            Chapter {chapter.index}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            {chapter.title}
          </h1>
        </div>
      ) : null}

      {phase === "driving" ? (
        <div className="pointer-events-none absolute bottom-4 right-4 text-right font-mono">
          <div className="text-3xl font-semibold tabular-nums">
            {speed}
            <span className="ml-1 text-xs text-muted-foreground">km/h</span>
          </div>
          <div className="text-xs text-muted-foreground">
            beacons {collected}/{beaconCount}
          </div>
        </div>
      ) : null}
    </>
  );
}
