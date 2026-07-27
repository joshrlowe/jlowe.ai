/**
 * Telemetry beacons — content-as-gameplay. Each beacon binds a corpus slug to a
 * position parameter `t` along a chapter's rail/track curve (0..1), so beacons
 * stay glued to the world when the curve re-tunes. Entering a beacon's sensor
 * opens its portfolio card and marks it collected.
 *
 * The Chapter 1 ("Ignition") beacon set retired with the driving world (now
 * standalone in the jlowe-world repo), so the list is empty; the machinery —
 * this shape, the chapter registry's `beacons` field, the HUD count, and
 * `hud/beacon-panel.tsx` — stays intact. Chapter 2 ("Escape Velocity", the
 * Anchorage space world) rebinds slugs to its patrol rail here.
 */
export interface BeaconDef {
  /** Corpus slug — the key into CORPUS and the collected-set id. */
  slug: string;
  /** Position along the chapter's curve, 0..1. */
  t: number;
}

// Empty while no chapter is registered. The registry in `chapters.ts` exposes a
// chapter's beacons as its `beacons` field; the HUD reads the *active*
// chapter's count (`chapterById(id).beacons.length`).
export const BEACONS: readonly BeaconDef[] = [];

/**
 * The beacon count — a test invariant kept in lockstep with the list. The live
 * HUD count is the active chapter's `beacons.length`, not this constant.
 */
export const BEACON_COUNT = BEACONS.length;
