"use client";

import { useSyncExternalStore } from "react";

function getSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("chapter");
}

function subscribe(): () => void {
  return () => {};
}

/** `?chapter=<id>` override for the active chapter (null = use the store). */
export function useChapterParam(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
