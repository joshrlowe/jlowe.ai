"use client";

import { HeroModel } from "./hero-model";

const TRAFFIC_CONE = "/hero/props/traffic-cone.glb";

interface Placement {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

// Track-edge cones on the far (+x) verge. The street lights / traffic lights
// that used to line the road read as a CITY STREET — the wrong genre for an F1
// track — so they're gone; a few cones stay as trackside dressing. The kerbs,
// barrier and run-off live in track-dressing.tsx.
const PLACEMENTS: Placement[] = [
  { url: TRAFFIC_CONE, position: [5.6, 0, -12] },
  { url: TRAFFIC_CONE, position: [5.6, 0, 0] },
  { url: TRAFFIC_CONE, position: [5.6, 0, 12] },
];

/** A few CC0 track-edge cones. */
export function HeroProps() {
  return (
    <>
      {PLACEMENTS.map((p, i) => (
        <HeroModel
          key={i}
          url={p.url}
          position={p.position}
          rotation={p.rotation}
          scale={p.scale}
        />
      ))}
    </>
  );
}
