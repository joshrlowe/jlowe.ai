"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Object3D } from "three/webgpu";

import { CameraRig, type CinematicDriveConfig } from "../core/camera-rig";
import { useQuality } from "../core/quality-provider";
import { GoldenHourEnvironment } from "./circuit/environment";
import {
  buildHeroDriveCurve,
  carPoseAlongCurve,
  HERO_DRIVE_LAP_SECONDS,
} from "./hero/car-rail";
import { HeroCubeReflection } from "./hero/cube-reflection";
import { HeroCar } from "./hero/hero-car";
import { HeroEnvironment } from "./hero/hero-environment";
import { HeroGrade } from "./hero/hero-grade";
import { HeroProps } from "./hero/props";
import { HeroRoad } from "./hero/road";

// Cinematic chase that arcs around the car as it laps the drive loop.
const HERO_CAMERA: CinematicDriveConfig = {
  distance: 9.5,
  height: 3.1,
  sweep: 0.6,
  sweepSpeed: 0.2,
  lookHeight: 0.7,
  positionDamping: 0.0016,
};

/**
 * The additive `?scene=hero` vignette: the curated F1-style car driving a
 * scripted loop down a short asphalt road with roadside props, lit by the
 * golden-hour HDRI and framed by a cinematic chase camera. A NON-chapter scene
 * — no FSM, no player driving (it's an on-rails trailer), no HUD; it reuses the
 * universal bloom+vignette post-FX floor mounted by world-canvas, so it runs on
 * every tier (webgl baseline and up). The ultra WebGPU path layers the
 * cinematic post-FX (SSGI/SSR/TRAA/DoF) over the top.
 */
export function HeroScene() {
  const { shadowMapSize } = useQuality();
  // Shared between the scene (which drives it below) and the cinematic camera
  // (which follows it). A direct <object3D> ref, matching the circuit chase cam.
  const carRef = useRef<Object3D | null>(null);
  const curve = useMemo(() => buildHeroDriveCurve(), []);
  const elapsed = useRef(0);

  // Drive the car around the closed loop on a timeline. carRef is a direct ref
  // mutated via methods; the camera then chases the freshly-driven transform.
  useFrame((_, delta) => {
    if (!carRef.current) return;
    elapsed.current += delta;
    const pose = carPoseAlongCurve(
      elapsed.current / HERO_DRIVE_LAP_SECONDS,
      curve,
    );
    carRef.current.position.set(
      pose.position[0],
      pose.position[1],
      pose.position[2],
    );
    carRef.current.rotation.set(0, pose.yaw, 0);
  });

  return (
    <>
      <HeroGrade />
      <HeroEnvironment />
      <GoldenHourEnvironment sunCastShadow shadowMapSize={shadowMapSize} />
      <HeroRoad />
      <HeroProps />
      <HeroCar driveRef={carRef} />
      {/* Ultra-only car-paint reflection; capture point is the scene origin.
          P6: make it follow the moving car (needs a lint-clean restructure of
          the memoised cube camera). */}
      <HeroCubeReflection />
      <CameraRig
        mode="cinematic-drive"
        target={carRef}
        cinematicDrive={HERO_CAMERA}
      />
    </>
  );
}
