"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { Object3D, PerspectiveCamera } from "three/webgpu";

import { CameraRig, type HeroPassConfig } from "../core/camera-rig";
import { useQuality } from "../core/quality-provider";
import { GoldenHourEnvironment } from "./circuit/environment";
import {
  buildHeroDriveCurve,
  carPoseAlongCurveOffset,
  type CarPose,
  HERO_DRIVE_LAP_SECONDS,
} from "./hero/car-rail";
import { HeroCubeReflection } from "./hero/cube-reflection";
import { Harbour } from "./hero/harbour";
import { HeroCar } from "./hero/hero-car";
import { HeroEnvironment } from "./hero/hero-environment";
import { HeroGrade } from "./hero/hero-grade";
import { HeroSky } from "./hero/hero-sky";
import { MonacoBuildings } from "./hero/monaco-buildings";
import { HeroProps } from "./hero/props";
import {
  laneEnvelope,
  LANE_OFFSET,
  overtakeProgress,
  RACE_CARS,
} from "./hero/race-grid";
import { HeroRoad } from "./hero/road";
import { TrackDressing } from "./hero/track-dressing";

// A fixed camera to the (sun-lit) side of the road; the cars drive past it and
// it pans to track them. Lifted from tyre height (0.85) to ~3.0 m — a trackside
// vantage — so the shot looks OVER the 1.0 m harbour wall onto the water +
// moored yachts (harbour.tsx). Below ~2.8 m the wall fully occludes the flat
// water from this distance; higher reveals more water but shrinks the cars.
// First-pass framing — dial in-browser.
const HERO_PASS: HeroPassConfig = {
  position: [-8, 3.0, 0],
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
 * Drive a car node along the rail via a plain function (parameter mutation), so
 * the react-hooks immutability lint is satisfied — same idiom as applyHeroFov.
 */
function driveCar(node: Object3D, pose: CarPose): void {
  node.position.set(pose.position[0], pose.position[1], pose.position[2]);
  node.rotation.set(0, pose.yaw, 0);
}

/** Park `node` at the midpoint of two others — the camera focus. */
function setMidpoint(node: Object3D, a: Object3D, b: Object3D): void {
  node.position.lerpVectors(a.position, b.position, 0.5);
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
  // One ref per race car + a focus node the camera tracks (the leader/challenger
  // midpoint). Direct <object3D> refs, mutated via methods each frame.
  const ref0 = useRef<Object3D | null>(null);
  const ref1 = useRef<Object3D | null>(null);
  const ref2 = useRef<Object3D | null>(null);
  const carRefs = [ref0, ref1, ref2];
  const focusRef = useRef<Object3D | null>(null);
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

  // Drive the three cars from one shared clock. The challenger gains a transient
  // forward Δt and swings into the overtaking lane to draw ALONGSIDE the leader
  // at the apex, then gives it back (net-zero → the grid loops seamlessly). The
  // camera tracks the leader/challenger midpoint so the battle stays framed.
  useFrame((_, delta) => {
    elapsed.current += delta;
    const baseT = elapsed.current / HERO_DRIVE_LAP_SECONDS;
    const phase = ((baseT % 1) + 1) % 1;
    const gain = overtakeProgress(phase);
    const lane = laneEnvelope(phase) * LANE_OFFSET;

    RACE_CARS.forEach((car, i) => {
      const node = carRefs[i]?.current;
      if (!node) return;
      const challenging = car.role === "challenger";
      const t = baseT + car.tOffset + (challenging ? gain : 0);
      driveCar(node, carPoseAlongCurveOffset(t, curve, challenging ? lane : 0));
    });

    const leader = ref1.current;
    const challenger = ref2.current;
    if (focusRef.current && leader && challenger) {
      setMidpoint(focusRef.current, leader, challenger);
    }
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
      <Harbour />
      <MonacoBuildings />
      <HeroProps />
      {RACE_CARS.map((car, i) => (
        <HeroCar key={i} driveRef={carRefs[i]} bodyColor={car.bodyColor} />
      ))}
      {/* Camera focus — parked at the leader/challenger midpoint each frame. */}
      <object3D ref={focusRef} />
      {/* Ultra-only car-paint reflection; capture point is the scene origin.
          P6: make it follow the moving cars. */}
      <HeroCubeReflection />
      <CameraRig mode="hero-pass" target={focusRef} heroPass={HERO_PASS} />
    </>
  );
}
