// The chapter registry — the single source of truth for what chapters exist,
// which scene each drives, and how they chain. The chapter store, router, HUD,
// and world-canvas all read this instead of hard-coding "ignition"/"circuit".
// Today only Chapter 1 ("Ignition", the coastal circuit) is registered; a
// second chapter plugs in by appending an entry and wiring `next`.

import { type BeaconDef, BEACONS } from "./beacons";

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

export const CHAPTERS: readonly ChapterMeta[] = [
  {
    id: "ignition",
    sceneKey: "circuit",
    title: "Ignition",
    index: 1,
    beacons: BEACONS,
    next: undefined,
  },
];

/** Look up a chapter by id (undefined when no chapter owns that id). */
export function chapterById(id: string): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

/** Look up the chapter that drives a given scene key (undefined = non-chapter). */
export function chapterForSceneKey(key: string): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.sceneKey === key);
}
