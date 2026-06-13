"use client";

import { Instance, Instances } from "@react-three/drei";
import { useMemo } from "react";

import { scatter } from "./scatter";

/** Land, sea, and an instanced cliff line along the coast (+x). */
export function Scenery() {
  const rocks = useMemo(
    () =>
      scatter(48, 1337, (r) => ({
        position: [
          62 + r.range(-4, 12),
          r.range(-2, 4),
          -82 + r.range(0, 96),
        ] as [number, number, number],
        rotation: [
          r.range(0, Math.PI),
          r.range(0, Math.PI * 2),
          r.range(0, Math.PI),
        ] as [number, number, number],
        scale: r.range(2.5, 7),
      })),
    [],
  );

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -35]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#1d1710" roughness={1} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[230, -6, -35]}>
        <planeGeometry args={[340, 540]} />
        <meshStandardMaterial
          color="#0b2735"
          roughness={0.18}
          metalness={0.65}
        />
      </mesh>

      <Instances limit={rocks.length}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#2c2118" roughness={0.95} flatShading />
        {rocks.map((rock, i) => (
          <Instance
            key={i}
            position={rock.position}
            rotation={rock.rotation}
            scale={rock.scale}
          />
        ))}
      </Instances>
    </>
  );
}
