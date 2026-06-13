"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { chapterStore, useChapter } from "../state/chapter-store";

/**
 * The chapter-exit transition (DOM): fades to black when `completing`, then
 * dispatches FADE_DONE on transition-end → `complete`, where it emits the
 * window `chapter:complete` event the Phase-6 router will consume.
 */
export function ChapterFade() {
  const phase = useChapter((s) => s.phase);
  const emitted = useRef(false);
  const opaque = phase === "completing" || phase === "complete";

  useEffect(() => {
    if (phase === "complete" && !emitted.current) {
      emitted.current = true;
      window.dispatchEvent(
        new CustomEvent("chapter:complete", {
          detail: { chapter: "ignition" },
        }),
      );
    }
    if (phase === "intro") emitted.current = false;
  }, [phase]);

  return (
    <div
      aria-hidden={!opaque}
      onTransitionEnd={() => {
        if (chapterStore.getState().phase === "completing") {
          chapterStore.getState().dispatch("FADE_DONE");
        }
      }}
      className={cn(
        "absolute inset-0 bg-background transition-opacity duration-1000",
        opaque ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      {phase === "complete" ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Chapter 1 complete
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">Ignition</h2>
          <button
            type="button"
            onClick={() => chapterStore.getState().dispatch("RESET")}
            className="mt-2 text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Replay chapter
          </button>
        </div>
      ) : null}
    </div>
  );
}
