"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { Object3D, PerspectiveCamera } from "three/webgpu";

import { CameraRig, type HeroPassConfig } from "../core/camera-rig";
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
import { HeroSky } from "./hero/hero-sky";
import { HeroProps } from "./hero/props";
import { HeroRoad } from "./hero/road";
import { TrackDressing } from "./hero/track-dressing";

// A fixed, low camera to the (sun-lit) side of the road; the car drives past it
// and the camera pans to track it. First-pass framing — dial in-browser.
const HERO_PASS: HeroPassConfig = {
  position: [-8, 0.85, 0],
  lookHeight: 0.5,
  lookDamping: 0.0008,
  dollyAmplitude: 1.1,
  dollySpeed: 0.12,
};

// A longer lens than the global 50° (world-canvas) compresses the scene into a
// cinematic "product shot." FOV is global on the shared camera, so snapshot +
// restore on unmount (mirrors HeroEnvironment / HeroGrade) to keep other scenes
// at 50°.
const HERO_FOV = 38;

/**
 * Apply a camera FOV via a plain function (not inside the component body) so the
 * react-hooks immutability lint — which forbids mutating a hook-returned value
 * directly — is satisfied, exactly as HeroEnvironment / HeroGrade do.
 */
function applyHeroFov(camera: PerspectiveCamera, fov: number): void {
  camera.fov = fov;
  camera.updateProjectionMatrix();
}

/**
 * The additive `?scene=hero` vignette: the curated F1-style car driving a
 * scripted loop down a short asphalt road with roadside props, lit by the
 * golden-hour HDRI and framed by a fixed, low cinematic camera the car drives
 * past. A NON-chapter scene — no FSM, no player driving (it's an on-rails
 * trailer), no HUD; it reuses the universal bloom+vignette post-FX floor
 * mounted by world-canvas, so it runs on every tier (webgl baseline and up). An
 * explicit `?quality=ultra` opt-in layers the heavy cinematic post-FX on top.
 */
export function HeroScene() {
  const { shadowMapSize, hdri } = useQuality();
  const { camera } = useThree();
  // Shared between the scene (which drives it below) and the hero-pass camera
  // (which tracks it). A direct <object3D> ref, matching the circuit chase cam.
  const carRef = useRef<Object3D | null>(null);
  const curve = useMemo(() => buildHeroDriveCurve(), []);
  const elapsed = useRef(0);

  // Swap to the longer cinematic lens while the hero scene is mounted; restore
  // the prior FOV on unmount so circuit / proving-ground keep the default 50°.
  useLayoutEffect(() => {
    const cam = camera as PerspectiveCamera;
    const prevFov = cam.fov;
    applyHeroFov(cam, HERO_FOV);
    return () => applyHeroFov(cam, prevFov);
  }, [camera]);

  // Drive the car around the closed loop on a timeline. carRef is a direct ref
  // mutated via methods; the camera then tracks the freshly-driven transform.
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
      {/* Clean F1-track sky: overrides the shared HDRI's city skyline on the
          background only (golden IBL stays). WebGPU/hdri tier only — the lower
          tiers already render a clean procedural sky. Mounted AFTER
          GoldenHourEnvironment so its background attach wins (LIFO-restored). */}
      {hdri ? <HeroSky /> : null}
      <HeroRoad />
      <TrackDressing />
      <HeroProps />
      <HeroCar driveRef={carRef} />
      {/* Ultra-only car-paint reflection; capture point is the scene origin.
          P6: make it follow the moving car (needs a lint-clean restructure of
          the memoised cube camera). */}
      <HeroCubeReflection />
      <CameraRig mode="hero-pass" target={carRef} heroPass={HERO_PASS} />
    </>
  );
}
