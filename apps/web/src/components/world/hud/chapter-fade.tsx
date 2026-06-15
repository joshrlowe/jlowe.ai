"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { chapterStore, useChapter } from "../state/chapter-store";
import { chapterById } from "../state/chapters";

/**
 * The chapter-exit transition (DOM): fades to black when `completing`, then
 * dispatches FADE_DONE on transition-end → `complete`, where it emits the
 * window `chapter:complete` event the router consumes (payload = the chapter
 * that just finished). The completion card reads the active chapter's meta.
 */
export function ChapterFade() {
  const phase = useChapter((s) => s.phase);
  const activeChapterId = useChapter((s) => s.activeChapterId);
  const chapter = chapterById(activeChapterId);
  const emitted = useRef(false);
  const opaque = phase === "completing" || phase === "complete";

  useEffect(() => {
    if (phase === "complete" && !emitted.current) {
      emitted.current = true;
      window.dispatchEvent(
        new CustomEvent("chapter:complete", {
          detail: { chapter: chapterStore.getState().activeChapterId },
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
      {phase === "complete" && chapter ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Chapter {chapter.index} complete
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            {chapter.title}
          </h2>
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
