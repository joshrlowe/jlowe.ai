"use client";

import { useSyncExternalStore } from "react";

import { parseQualityOverride, type QualityOverride } from "./ultra";

function getSnapshot(): QualityOverride | null {
  if (typeof window === "undefined") return null;
  return parseQualityOverride(window.location.search);
}

function subscribe(): () => void {
  return () => {};
}

/** `?quality=ultra|high|standard` override for the ultra axis (null = none). */
export function useQualityParam(): QualityOverride | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
