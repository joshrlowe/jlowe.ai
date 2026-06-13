"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Golden-hour lighting from procedural Lightformers (original IBL, zero HDR
 * bytes): a low warm sun toward -x, a cool sky fill, and a sea-side bounce.
 */
export function GoldenHourEnvironment() {
  return (
    <>
      <color attach="background" args={["#241405"]} />
      <ambientLight intensity={0.3} color="#ffb877" />
      <directionalLight
        position={[-50, 14, 18]}
        intensity={2.4}
        color="#ff9b4a"
      />
      <Environment resolution={256}>
        <Lightformer
          intensity={3.4}
          position={[-34, 7, 16]}
          scale={[22, 9, 1]}
          color="#ffd98a"
        />
        <Lightformer
          intensity={1.4}
          position={[0, 16, -34]}
          scale={[40, 12, 1]}
          color="#6b5a8c"
        />
        <Lightformer
          intensity={1.1}
          position={[40, 5, -20]}
          scale={[14, 14, 1]}
          color="#ff7e3d"
        />
      </Environment>
    </>
  );
}
