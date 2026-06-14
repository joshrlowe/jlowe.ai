/**
 * Telemetry beacons — content-as-gameplay. Each beacon binds a corpus slug to a
 * position parameter `t` along the track curve (0..1), so beacons stay glued to
 * the circuit when the track re-tunes. Driving a beacon's sensor opens its
 * portfolio card and marks it collected. The pit tunnel sits at t≈0.5, so the
 * beacons give it a wide berth; the slugs trace a narrative as you lap the
 * circuit from the spawn (t≈0).
 */
export interface BeaconDef {
  /** Corpus slug — the key into CORPUS and the collected-set id. */
  slug: string;
  /** Position along the track curve, 0..1. */
  t: number;
}

export const BEACONS: readonly BeaconDef[] = [
  { slug: "bidops", t: 0.1 },
  { slug: "velocity", t: 0.24 },
  { slug: "rag", t: 0.38 },
  { slug: "reliability", t: 0.62 },
  { slug: "about", t: 0.82 },
];

export const BEACON_COUNT = BEACONS.length;
