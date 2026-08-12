"use client";

import { RoundedBox } from "@react-three/drei";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { useControls } from "leva";

import { CameraRig } from "../core/camera-rig";
import { GoldenHourEnvironment } from "../core/environment";

/**
 * Fixture scene proving the whole pipeline: a pure-light golden rig (WebGPU-
 * safe — drei's <Environment> bakes through a ShaderMaterial the NodeBuilder
 * rejects), a "test vehicle" that drops under Rapier physics onto a ground
 * collider, lit for the post-FX chain.
 */
export function FixtureScene() {
  const { paused } = useControls("physics", { paused: false });

  return (
    <>
      <GoldenHourEnvironment />

      <Physics paused={paused} gravity={[0, -9.81, 0]}>
        <RigidBody
          colliders="cuboid"
          position={[0, 5, 0]}
          restitution={0.4}
          friction={0.8}
        >
          <RoundedBox args={[2, 0.8, 3.4]} radius={0.18} smoothness={4}>
            <meshStandardMaterial
              color="#2a63ff"
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
      <CameraRig mode="free" />
    </>
  );
}
