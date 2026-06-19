"use client";

import { Suspense, type ReactNode } from "react";

export type SceneRegistry = Record<string, () => ReactNode>;

/**
 * Resolve a requested scene key against the registry, falling back to the
 * default scene when the key names no registered scene (e.g. an unregistered
 * `?scene=` value). Keeps the registry the single keyed source of truth so
 * scenes stay independent and a missing key degrades to the default geometry.
 */
export function resolveSceneKey(
  requested: string,
  scenes: SceneRegistry,
  fallback: string,
): string {
  return requested in scenes ? requested : fallback;
}

/**
 * Mounts exactly one registered chapter scene by key, unmounting the previous
 * one (React swaps subtrees on key change) behind a Suspense boundary. This is
 * the seam the chapter finite-state machine drives in a later phase.
 */
export function SceneManager({
  scenes,
  active,
  fallback = null,
}: {
  scenes: SceneRegistry;
  active: string;
  fallback?: ReactNode;
}) {
  const render = scenes[active];
  return <Suspense fallback={fallback}>{render ? render() : null}</Suspense>;
}
