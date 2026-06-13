"use client";

import { Instance, Instances } from "@react-three/drei";
import { useMemo } from "react";

import { scatter } from "./scatter";

interface Placement {
  position: [number, number, number];
  scale: number;
  rotY: number;
}

// A ring biased inland (the track loop fits within ~radius 55 of (0,-35)).
function ringScatter(count: number, seed: number): Placement[] {
  return scatter(count, seed, (r) => {
    const angle = r.range(0, Math.PI * 2);
    const radius = r.range(62, 135);
    return {
      position: [
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius - 35,
      ] as [number, number, number],
      scale: r.range(0.7, 1.4),
      rotY: r.range(0, Math.PI * 2),
    };
  }).filter((p) => p.position[0] < 56); // keep out of the sea
}

export function Foliage() {
  const palms = useMemo(() => ringScatter(60, 7), []);
  const pines = useMemo(() => ringScatter(80, 99), []);

  return (
    <>
      <Instances limit={palms.length}>
        <cylinderGeometry args={[0.14, 0.22, 5, 6]} />
        <meshStandardMaterial color="#5a4326" roughness={0.9} />
        {palms.map((p, i) => (
          <Instance
            key={i}
            position={[p.position[0], 2.5 * p.scale, p.position[2]]}
            scale={p.scale}
            rotation={[0, p.rotY, 0]}
          />
        ))}
      </Instances>
      <Instances limit={palms.length}>
        <icosahedronGeometry args={[1.6, 0]} />
        <meshStandardMaterial color="#2f4a1d" roughness={0.85} flatShading />
        {palms.map((p, i) => (
          <Instance
            key={i}
            position={[p.position[0], 5 * p.scale, p.position[2]]}
            scale={[p.scale * 1.3, p.scale * 0.7, p.scale * 1.3]}
          />
        ))}
      </Instances>

      <Instances limit={pines.length}>
        <cylinderGeometry args={[0.16, 0.24, 3, 6]} />
        <meshStandardMaterial color="#4a3420" roughness={0.9} />
        {pines.map((p, i) => (
          <Instance
            key={i}
            position={[p.position[0], 1.5 * p.scale, p.position[2]]}
            scale={p.scale}
          />
        ))}
      </Instances>
      <Instances limit={pines.length}>
        <coneGeometry args={[1.4, 4, 7]} />
        <meshStandardMaterial color="#27401b" roughness={0.85} flatShading />
        {pines.map((p, i) => (
          <Instance
            key={i}
            position={[p.position[0], 4 * p.scale, p.position[2]]}
            scale={p.scale}
          />
        ))}
      </Instances>
    </>
  );
}
