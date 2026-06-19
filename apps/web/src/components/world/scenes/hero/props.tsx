"use client";

import { HeroModel } from "./hero-model";

const STREET_LIGHT = "/assets/props/street-light.glb";
const TRAFFIC_LIGHT = "/assets/props/traffic-light.glb";
const TRAFFIC_CONE = "/assets/props/traffic-cone.glb";

interface Placement {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

// Roadside dressing along both shoulders (road half-width ~4.5).
const PLACEMENTS: Placement[] = [
  { url: STREET_LIGHT, position: [-6.5, 0, -14], rotation: [0, Math.PI / 2, 0] },
  { url: STREET_LIGHT, position: [-6.5, 0, 12], rotation: [0, Math.PI / 2, 0] },
  { url: TRAFFIC_LIGHT, position: [6.5, 0, -10], rotation: [0, -Math.PI / 2, 0] },
  { url: TRAFFIC_CONE, position: [3.6, 0, 6] },
  { url: TRAFFIC_CONE, position: [-3.4, 0, 9] },
  { url: TRAFFIC_CONE, position: [3.9, 0, -4] },
];

/** A few CC0 roadside props lining the asphalt. */
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
