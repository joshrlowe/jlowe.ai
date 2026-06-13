"use client";

import { Suspense, type ReactNode } from "react";

export type SceneRegistry = Record<string, () => ReactNode>;

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
