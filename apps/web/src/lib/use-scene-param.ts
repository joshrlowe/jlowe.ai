"use client";

import { useSyncExternalStore } from "react";

function getSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("scene");
}

function subscribe(): () => void {
  return () => {};
}

/** `?scene=<key>` override for the active world scene (null = default). */
export function useSceneParam(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
