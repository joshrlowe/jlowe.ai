"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { Object3D, PerspectiveCamera } from "three/webgpu";

import { CameraRig, type HeroPassConfig } from "../core/camera-rig";
import { useQuality } from "../core/quality-provider";
import {
  buildHeroDriveCurve,
  carPoseAlongCurveOffset,
  type CarPose,
  HERO_DRIVE_LAP_SECONDS,
} from "./hero/car-rail";
import { HeroCubeReflection } from "./hero/cube-reflection";
import { Harbour } from "./hero/harbour";
import { HeroCar } from "./hero/hero-car";
import { HeroGrade } from "./hero/hero-grade";
import { HeroNight } from "./hero/hero-night";
import { MonacoBuildings } from "./hero/monaco-buildings";
import { HeroProps } from "./hero/props";
import { CHALLENGER_LANE, passSwap, RACE_CARS } from "./hero/race-grid";
import { HeroRoad } from "./hero/road";
import { TrackDressing } from "./hero/track-dressing";

// A fixed camera to the side of the road; the pack drives past it and it pans to
// track the battle. Lifted to a trackside ~3.0 m vantage so it looks over the
// harbour wall onto the water + yachts. `lookClamp` pins the pan to the straight
// window (car-rail.ts) so it never yaws around to the hidden return leg — the
// cars just rip off down the road and the next lap sweeps back in. First-pass
// framing — dial in-browser.
const HERO_PASS: HeroPassConfig = {
  position: [-8, 3.0, 0],
  lookHeight: 0.5,
  lookDamping: 0.0008,
  dollyAmplitude: 1.1,
  dollySpeed: 0.12,
  lookClamp: { x: 4, z: 20 },
};

// A longer lens than the global 50° (world-canvas) compresses the scene into a
// cinematic "product shot." FOV is global on the shared camera, so snapshot +
// restore on unmount (mirrors HeroGrade) to keep other scenes at 50°.
const HERO_FOV = 38;

/** Order of `RACE_CARS`: the leader/challenger the camera frames as its battle. */
const LEADER_INDEX = RACE_CARS.findIndex((c) => c.role === "leader");
const CHALLENGER_INDEX = RACE_CARS.findIndex((c) => c.role === "challenger");

/**
 * Apply a camera FOV via a plain function (not inside the component body) so the
 * react-hooks immutability lint — which forbids mutating a hook-returned value
 * directly — is satisfied, exactly as HeroGrade does.
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
 * The additive `?scene=hero` vignette: a five-car field ripping down a Monaco
 * night straight, with a red leader and a gold challenger trading the lead
 * wheel-to-wheel as they sweep the fixed, trackside camera. A NON-chapter scene
 * — no FSM, no player driving (it's an on-rails trailer), no HUD; it reuses the
 * universal bloom+vignette post-FX floor mounted by world-canvas, so it runs on
 * every tier (webgl baseline and up). An explicit `?quality=ultra` opt-in layers
 * the heavy cinematic post-FX on top.
 */
export function HeroScene() {
  const { shadowMapSize } = useQuality();
  const { camera } = useThree();
  // One ref per race car + a focus node the camera tracks (the leader/challenger
  // midpoint). Direct <object3D> refs, mutated via methods each frame.
  const ref0 = useRef<Object3D | null>(null);
  const ref1 = useRef<Object3D | null>(null);
  const ref2 = useRef<Object3D | null>(null);
  const ref3 = useRef<Object3D | null>(null);
  const ref4 = useRef<Object3D | null>(null);
  const carRefs = [ref0, ref1, ref2, ref3, ref4];
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

  // Drive the field from one shared clock. The challenger rides the near lane
  // (CHALLENGER_LANE) and saws forward/back relative to the leader on `passSwap`
  // (net-periodic → the grid loops seamlessly), so across the straight it enters
  // behind, draws level, and noses ahead — a clean pass. The camera tracks the
  // leader/challenger midpoint so the battle stays framed.
  useFrame((_, delta) => {
    elapsed.current += delta;
    const baseT = elapsed.current / HERO_DRIVE_LAP_SECONDS;
    const basePhase = ((baseT % 1) + 1) % 1;
    const swap = passSwap(basePhase);

    RACE_CARS.forEach((car, i) => {
      const node = carRefs[i]?.current;
      if (!node) return;
      const challenging = car.role === "challenger";
      const t = baseT + car.tOffset + (challenging ? swap : 0);
      const lane = challenging ? CHALLENGER_LANE : 0;
      driveCar(node, carPoseAlongCurveOffset(t, curve, lane));
    });

    const leader = carRefs[LEADER_INDEX]?.current;
    const challenger = carRefs[CHALLENGER_INDEX]?.current;
    if (focusRef.current && leader && challenger) {
      setMidpoint(focusRef.current, leader, challenger);
    }
  });

  return (
    <>
      <HeroGrade />
      {/* Mediterranean night: dim cool moon + procedural night IBL, replacing the
          shared golden sun/HDRI for this scene only (circuit stays golden). */}
      <HeroNight sunCastShadow shadowMapSize={shadowMapSize} />
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
