"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three/webgpu";

import { buildStarfield } from "./transit-stars";

const STAR_COUNT = 900;
const STAR_SEED = 0x5ec7042; // "sector 42" — any fixed seed; determinism is the point
const DRIFT_RADIANS_PER_SEC = 0.004;

/**
 * The in-transit hold — the default `/world` view while no chapter is
 * registered (Chapter 1 retired to the standalone jlowe-world repo; Chapter 2
 * "Escape Velocity" is inbound). A zero-asset, zero-physics starfield over a
 * deep-space backdrop: a seeded `<points>` shell drifting almost imperceptibly
 * (static under prefers-reduced-motion). The diegetic next-chapter notice is a
 * DOM overlay (`transit-notice.tsx`), not part of this canvas scene.
 */
export function TransitScene() {
  const group = useRef<THREE.Group | null>(null);
  const { positions, colors } = useMemo(
    () => buildStarfield(STAR_COUNT, STAR_SEED),
    [],
  );
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useFrame((_, delta) => {
    if (reducedMotion || !group.current) return;
    group.current.rotation.y += delta * DRIFT_RADIANS_PER_SEC;
  });

  return (
    <>
      <color attach="background" args={["#060a14"]} />
      <group ref={group}>
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions, 3]}
            />
            <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.65}
            sizeAttenuation
            vertexColors
            depthWrite={false}
          />
        </points>
      </group>
    </>
  );
}
