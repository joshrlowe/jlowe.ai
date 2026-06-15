"use client";

import {
  CuboidCollider,
  Physics,
  type RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import type * as THREE from "three/webgpu";

import { CameraRig } from "../core/camera-rig";
import { BEACONS } from "../state/beacons";
import { cameraModeForPhase } from "../state/camera-mode";
import { isControllable } from "../state/chapter-fsm";
import { chapterStore, useChapter } from "../state/chapter-store";
import { Vehicle } from "../vehicle/vehicle";
import { Beacon } from "./circuit/beacon";
import { GoldenHourEnvironment } from "./circuit/environment";
import { Foliage } from "./circuit/foliage";
import { Scenery } from "./circuit/scenery";
import { Track } from "./circuit/track";
import { buildTrack, trackSpawn } from "./circuit/track-geometry";

const CIRCUIT_CENTER: [number, number, number] = [0, 0, -35];
const INTRO_FLYOVER: [number, number, number][] = [
  [-80, 55, 40],
  [-40, 42, -18],
  [22, 36, -62],
  [62, 46, -92],
  [44, 52, 24],
];

const setTelemetry = (t: { speedKmh: number; rpm: number }) =>
  chapterStore.getState().setTelemetry(t);

export function CircuitScene() {
  const chassisRef = useRef<RapierRigidBody | null>(null);
  const cameraTargetRef = useRef<THREE.Object3D | null>(null);
  const { geometry, curve } = useMemo(() => buildTrack(), []);
  const spawn = useMemo(() => trackSpawn(curve), [curve]);
  const pit = useMemo(() => {
    const p = curve.getPointAt(0.5);
    const tan = curve.getTangentAt(0.5);
    return {
      position: [p.x, 0, p.z] as [number, number, number],
      angle: Math.atan2(tan.x, tan.z),
    };
  }, [curve]);
  const beacons = useMemo(
    () =>
      BEACONS.map((b) => {
        const p = curve.getPointAt(b.t);
        return {
          slug: b.slug,
          position: [p.x, 0, p.z] as [number, number, number],
        };
      }),
    [curve],
  );

  const phase = useChapter((s) => s.phase);

  // Cinematic timers: intro flyover → brief handoff → driving.
  useEffect(() => {
    if (phase === "intro") {
      const id = setTimeout(
        () => chapterStore.getState().dispatch("INTRO_DONE"),
        5000,
      );
      return () => clearTimeout(id);
    }
    if (phase === "handoff") {
      const id = setTimeout(
        () => chapterStore.getState().dispatch("HANDOFF_DONE"),
        1500,
      );
      return () => clearTimeout(id);
    }
  }, [phase]);

  return (
    <>
      <GoldenHourEnvironment />
      <Track geometry={geometry} />
      <Scenery />
      <Foliage />

      {/* pit-tunnel arch at the far side of the loop */}
      <group position={pit.position} rotation={[0, pit.angle, 0]}>
        <mesh position={[-6, 2.5, 0]} castShadow>
          <boxGeometry args={[0.6, 5, 0.6]} />
          <meshStandardMaterial color="#0d0a07" roughness={0.7} />
        </mesh>
        <mesh position={[6, 2.5, 0]} castShadow>
          <boxGeometry args={[0.6, 5, 0.6]} />
          <meshStandardMaterial color="#0d0a07" roughness={0.7} />
        </mesh>
        <mesh position={[0, 5.2, 0]} castShadow>
          <boxGeometry args={[12.6, 0.6, 0.8]} />
          <meshStandardMaterial
            color="#e85d04"
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>
      </group>

      <Physics>
        <Vehicle
          chassisRef={chassisRef}
          cameraTargetRef={cameraTargetRef}
          spawn={spawn}
          controllable={isControllable(phase)}
          onTelemetry={setTelemetry}
        />
        {/* land floor */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[250, 0.1, 250]} position={[0, -0.1, -35]} />
        </RigidBody>
        {/* coastline barrier — keep the car out of the sea */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[1.5, 4, 110]} position={[74, 4, -35]} />
        </RigidBody>
        {/* pit-tunnel exit sensor (the reducer ignores it unless driving) */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider
            sensor
            args={[6, 3, 1]}
            position={pit.position}
            rotation={[0, pit.angle, 0]}
            onIntersectionEnter={() =>
              chapterStore.getState().dispatch("EXIT_TRIGGERED")
            }
          />
        </RigidBody>
        {beacons.map((b) => (
          <Beacon key={b.slug} slug={b.slug} position={b.position} />
        ))}
      </Physics>

      <CameraRig
        mode={cameraModeForPhase(phase)}
        path={INTRO_FLYOVER}
        lookAt={CIRCUIT_CENTER}
        speed={0.05}
        target={cameraTargetRef}
      />
    </>
  );
}
