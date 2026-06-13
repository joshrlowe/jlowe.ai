"use client";

import { useSyncExternalStore } from "react";

import {
  detectCapabilityTier,
  refineCapabilityTier,
  type CapabilityReport,
} from "./capabilities";

/**
 * Module-level capability store. Detection runs once per page session and is
 * read SSR-safely via useSyncExternalStore: the server snapshot is `null` (the
 * caller shows a neutral loading state), the client snapshot is the detected
 * report, and the async WebGPU adapter check notifies subscribers when it
 * refines the tier. This avoids setState-in-effect entirely.
 */
let cached: CapabilityReport | null = null;
let refineStarted = false;
const listeners = new Set<() => void>();

function ensureRefine(): void {
  if (refineStarted || cached === null) return;
  refineStarted = true;
  const before = cached;
  void refineCapabilityTier(before).then((refined) => {
    if (refined !== before) {
      cached = refined;
      for (const listener of listeners) listener();
    }
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  cached ??= detectCapabilityTier();
  ensureRefine();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): CapabilityReport | null {
  return (cached ??= detectCapabilityTier());
}

function getServerSnapshot(): CapabilityReport | null {
  return null;
}

export function useCapabilityTier(): CapabilityReport | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
