"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";

import { chapterStore, useChapter } from "../../state/chapter-store";

const ACTIVE = "#ffb703";
const COLLECTED = "#5a4a32";

/**
 * One telemetry beacon: an emissive light column + floating orb marking a
 * corpus card, plus a rapier sensor. Driving through the sensor collects the
 * beacon and opens its panel; collected beacons dim. (Five individual meshes ×2
 * stay well inside the <100-draw budget — no need to instance so few.)
 */
export function Beacon({
  slug,
  position,
}: {
  slug: string;
  position: [number, number, number];
}) {
  const collected = useChapter((s) => s.collectedBeacons.includes(slug));
  const color = collected ? COLLECTED : ACTIVE;

  return (
    <group position={position}>
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={collected ? 0.4 : 2.4}
          transparent
          opacity={collected ? 0.25 : 0.7}
        />
      </mesh>
      <mesh position={[0, 8.4, 0]} castShadow>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={collected ? 0.4 : 3}
        />
      </mesh>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          sensor
          args={[3, 4, 3]}
          position={[0, 2, 0]}
          onIntersectionEnter={() => {
            const s = chapterStore.getState();
            s.collectBeacon(slug);
            s.openBeacon(slug);
          }}
        />
      </RigidBody>
    </group>
  );
}
