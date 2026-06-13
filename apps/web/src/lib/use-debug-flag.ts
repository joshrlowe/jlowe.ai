"use client";

import { useSyncExternalStore } from "react";

// `?debug=1` enables the dev overlays. Read SSR-safely (false on the server),
// resolved once on the client; it doesn't change after load.
let cached: boolean | null = null;

function getSnapshot(): boolean {
  if (cached === null) {
    cached =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("debug") === "1";
  }
  return cached;
}

function subscribe(): () => void {
  return () => {};
}

export function useDebugFlag(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
