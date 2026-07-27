// The chapter registry — the single source of truth for what chapters exist,
// which scene each drives, and how they chain. The chapter store, router, HUD,
// and world-canvas all read this instead of hard-coding chapter ids.
//
// Chapter 1 ("Ignition", the drivable coastal circuit) retired with the
// driving world — it lives on standalone in the jlowe-world repo — so the
// registry is empty while Chapter 2 ("Escape Velocity", the Anchorage space
// world) is built. A chapter plugs in by appending an entry and wiring `next`;
// with no chapter registered, the world holds on the in-transit scene.

import { type BeaconDef } from "./beacons";

export interface ChapterMeta {
  /** Stable id — the persistence key and the `chapter:complete` payload. */
  id: string;
  /** Scene-registry key this chapter mounts (see world-canvas SCENES). */
  sceneKey: string;
  /** Display title (the HUD title card + completion screen). */
  title: string;
  /** 1-based chapter number (the "Chapter N" label). */
  index: number;
  /** This chapter's telemetry beacons. */
  beacons: readonly BeaconDef[];
  /** The chapter the router advances to on completion; undefined = the end. */
  next?: string;
}

/**
 * The scene the world mounts when no chapter is registered (also the
 * unknown-`?scene=` fallback): the in-transit hold — a starfield with the
 * next-chapter notice.
 */
export const FALLBACK_SCENE_KEY = "transit";

export const CHAPTERS: readonly ChapterMeta[] = [];

/** Look up a chapter by id (undefined when no chapter owns that id). */
export function chapterById(id: string): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

/** Look up the chapter that drives a given scene key (undefined = non-chapter). */
export function chapterForSceneKey(key: string): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.sceneKey === key);
}
