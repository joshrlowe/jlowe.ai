"use client";

import type * as THREE from "three/webgpu";

/** The road ribbon (one draw call). Geometry is built once in CircuitScene. */
export function Track({ geometry }: { geometry: THREE.BufferGeometry }) {
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.92} metalness={0.02} />
    </mesh>
  );
}
