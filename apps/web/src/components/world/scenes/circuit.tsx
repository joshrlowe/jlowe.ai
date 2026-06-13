"use client";

import {
  CuboidCollider,
  Physics,
  type RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { useMemo, useRef } from "react";
import type * as THREE from "three/webgpu";

import { CameraRig } from "../core/camera-rig";
import { Vehicle } from "../vehicle/vehicle";
import { GoldenHourEnvironment } from "./circuit/environment";
import { Foliage } from "./circuit/foliage";
import { Scenery } from "./circuit/scenery";
import { Track } from "./circuit/track";
import { buildTrack, trackSpawn } from "./circuit/track-geometry";

/**
 * Chapter 1 "Ignition" — a coastal circuit at golden hour. The car (reused
 * verbatim from the proving ground) spawns on the track; instanced foliage,
 * cliffs, and a single-draw track ribbon keep it well under 100 draw calls.
 */
export function CircuitScene() {
  const chassisRef = useRef<RapierRigidBody | null>(null);
  const cameraTargetRef = useRef<THREE.Object3D | null>(null);
  const { geometry, curve } = useMemo(() => buildTrack(), []);
  const spawn = useMemo(() => trackSpawn(curve), [curve]);

  return (
    <>
      <GoldenHourEnvironment />
      <Track geometry={geometry} />
      <Scenery />
      <Foliage />

      <Physics>
        <Vehicle
          chassisRef={chassisRef}
          cameraTargetRef={cameraTargetRef}
          spawn={spawn}
        />
        {/* land floor */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[250, 0.1, 250]} position={[0, -0.1, -35]} />
        </RigidBody>
        {/* coastline barrier — keep the car out of the sea */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[1.5, 4, 110]} position={[74, 4, -35]} />
        </RigidBody>
      </Physics>

      <CameraRig mode="chase" target={cameraTargetRef} />
    </>
  );
}
