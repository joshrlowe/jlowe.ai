"use client";

import { useEffect } from "react";

import { chapterStore } from "./chapter-store";
import { type ChapterMeta, chapterById } from "./chapters";

/**
 * Pure advance rule: the id the router moves to after `completedId` finishes,
 * resolved against an explicit registry — undefined when the completed chapter
 * is unknown or is the final chapter. Registry-injected so the rule is testable
 * against a synthetic registry (the live one currently ends at Chapter 1).
 */
export function resolveNextChapter(
  registry: readonly ChapterMeta[],
  completedId: string,
): string | undefined {
  return registry.find((c) => c.id === completedId)?.next;
}

/**
 * The chapter that follows the one that just completed in the live registry, or
 * undefined when it's unknown or final. Factored out of the DOM handler so the
 * advance rule is unit-testable without a window event.
 */
export function nextChapterFor(completedId: string): string | undefined {
  return chapterById(completedId)?.next;
}

/**
 * On a `chapter:complete` window event, advance to the completed chapter's
 * `next` (if any) via `setChapter` — which swaps the scene, restarts the FSM,
 * and clears the open beacon. Unknown ids and final chapters are no-ops.
 */
export function advanceOnComplete(completedId: string): void {
  const next = nextChapterFor(completedId);
  if (next) chapterStore.getState().setChapter(next);
}

/**
 * Headless cross-chapter router: listens once for the `chapter:complete` event
 * the chapter fade emits and advances the store to the next chapter. Renders
 * nothing. Today the only chapter has `next: undefined`, so this is inert until
 * a second chapter is registered.
 */
export function ChapterRouter() {
  useEffect(() => {
    const onComplete = (e: Event) => {
      const detail = (e as CustomEvent<{ chapter?: string }>).detail;
      if (detail?.chapter) advanceOnComplete(detail.chapter);
    };
    window.addEventListener("chapter:complete", onComplete);
    return () => window.removeEventListener("chapter:complete", onComplete);
  }, []);

  return null;
}
