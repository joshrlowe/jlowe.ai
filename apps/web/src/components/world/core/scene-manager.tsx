"use client";

import { Suspense, type ReactNode } from "react";

export type SceneRegistry = Record<string, () => ReactNode>;

/**
 * Resolve a requested scene key against the registry, falling back to the
 * default scene when the key names no registered scene (e.g. an unregistered
 * `?scene=` value). Keeps the registry the single keyed source of truth so
 * scenes stay independent and a missing key degrades to the default geometry.
 *
 * Uses an own-property check, not `key in scenes`: `in` walks the prototype
 * chain, so untrusted values like `__proto__`/`constructor`/`toString` would
 * otherwise "match" `Object.prototype` members and skip the fallback,
 * resolving to a non-component and crashing inside Suspense.
 */
export function resolveSceneKey(
  requested: string,
  scenes: SceneRegistry,
  fallback: string,
): string {
  return Object.hasOwn(scenes, requested) ? requested : fallback;
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
  const render = Object.hasOwn(scenes, active) ? scenes[active] : undefined;
  return <Suspense fallback={fallback}>{render ? render() : null}</Suspense>;
}
