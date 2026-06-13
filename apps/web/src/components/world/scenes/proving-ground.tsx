"use client";

import { Environment, Grid, Lightformer } from "@react-three/drei";
import {
  CuboidCollider,
  Physics,
  type RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { useRef } from "react";
import type * as THREE from "three/webgpu";

import { CameraRig } from "../core/camera-rig";
import { Vehicle } from "../vehicle/vehicle";

/**
 * Flat tuning surface for the vehicle (reach via ?scene=proving-ground). The
 * chase camera follows an Object3D inside the chassis; the circuit scene reuses
 * <Vehicle> verbatim later.
 */
export function ProvingGroundScene() {
  const chassisRef = useRef<RapierRigidBody | null>(null);
  const cameraTargetRef = useRef<THREE.Object3D | null>(null);

  return (
    <>
      <color attach="background" args={["#0a0705"]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[8, 12, 6]} intensity={1.6} />
      <Environment resolution={256}>
        <Lightformer
          intensity={2.2}
          position={[0, 8, 0]}
          scale={[14, 14, 1]}
          color="#ffe0b0"
        />
        <Lightformer
          intensity={1}
          position={[-6, 3, 4]}
          scale={[6, 6, 1]}
          color="#e85d04"
        />
      </Environment>

      <Grid
        args={[200, 200]}
        cellColor="#2a2018"
        sectionColor="#3a2c1e"
        infiniteGrid
        fadeDistance={120}
        position={[0, 0.01, 0]}
      />

      <Physics>
        <Vehicle chassisRef={chassisRef} cameraTargetRef={cameraTargetRef} />
        <RigidBody type="fixed">
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[400, 400]} />
            <meshStandardMaterial
              color="#15110d"
              roughness={0.95}
              metalness={0.05}
            />
          </mesh>
          <CuboidCollider args={[200, 0.05, 200]} />
        </RigidBody>
      </Physics>

      <CameraRig mode="chase" target={cameraTargetRef} />
    </>
  );
}
