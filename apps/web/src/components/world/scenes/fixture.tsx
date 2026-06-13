"use client";

import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { useControls } from "leva";

/**
 * Fixture scene proving the whole pipeline: image-based lighting (a procedural
 * Lightformer environment — original, no external HDR), a "test vehicle" that
 * drops under Rapier physics onto a ground collider, lit for the post-FX chain.
 */
export function FixtureScene() {
  const { paused } = useControls("physics", { paused: false });

  return (
    <>
      <color attach="background" args={["#0a0705"]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 8, 5]} intensity={1.8} />

      <Environment resolution={256}>
        <Lightformer
          intensity={2.2}
          position={[0, 5, -5]}
          scale={[10, 10, 1]}
          color="#ffd9a0"
        />
        <Lightformer
          intensity={1.2}
          position={[-5, 2, 2]}
          scale={[6, 6, 1]}
          color="#e85d04"
        />
      </Environment>

      <Physics paused={paused} gravity={[0, -9.81, 0]}>
        <RigidBody
          colliders="cuboid"
          position={[0, 5, 0]}
          restitution={0.4}
          friction={0.8}
        >
          <RoundedBox args={[2, 0.8, 3.4]} radius={0.18} smoothness={4}>
            <meshStandardMaterial
              color="#e85d04"
              metalness={0.5}
              roughness={0.35}
            />
          </RoundedBox>
        </RigidBody>

        <RigidBody type="fixed">
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[40, 40]} />
            <meshStandardMaterial
              color="#1a1410"
              metalness={0.1}
              roughness={0.9}
            />
          </mesh>
          <CuboidCollider args={[20, 0.05, 20]} />
        </RigidBody>
      </Physics>
    </>
  );
}
