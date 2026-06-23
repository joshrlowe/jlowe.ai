"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useMemo, useRef } from "react";
import * as THREE from "three/webgpu";

import {
  cinematicCameraPose,
  type CinematicPathConfig,
} from "../scenes/hero/camera-path";

export type CameraMode =
  | "rails"
  | "free"
  | "chase"
  | "cinematic"
  | "cinematic-drive";

/** Config for `cinematic-drive`: an eased chase that arcs around the moving car. */
export interface CinematicDriveConfig {
  /** Chase distance from the car on the ground plane (world units). */
  distance: number;
  /** Camera height above the car. */
  height: number;
  /** Azimuth sweep amplitude (radians) — how far the camera arcs side to side. */
  sweep: number;
  /** Sweep speed (radians/sec of the sine driver). */
  sweepSpeed: number;
  /** Raise the look target above the car origin, onto the body. */
  lookHeight: number;
  /** Position-follow retention per second (smaller = snappier). */
  positionDamping: number;
}

const CINEMATIC_DRIVE_DEFAULTS: CinematicDriveConfig = {
  distance: 9,
  height: 3,
  sweep: 0.55,
  sweepSpeed: 0.22,
  lookHeight: 0.7,
  positionDamping: 0.0018,
};

interface CameraRigProps {
  mode?: CameraMode;
  /** Control points for the `rails` spline. */
  path?: readonly [number, number, number][];
  /** Where the `rails` camera looks (defaults to the origin). */
  lookAt?: readonly [number, number, number];
  /** Object to follow in `chase` mode. */
  target?: RefObject<THREE.Object3D | null>;
  speed?: number;
  /** Slow dolly-orbit config for `cinematic` mode (non-interactive scenes). */
  cinematic?: CinematicPathConfig;
  /** Chase-orbit config for `cinematic-drive` mode (follows `target`). */
  cinematicDrive?: CinematicDriveConfig;
}

/**
 * Drives the active camera: `rails` follows a closed Catmull-Rom spline, `free`
 * hands control to OrbitControls, `chase` lerp-follows a target, `cinematic`
 * dolly-orbits a fixed point, and `cinematic-drive` chase-orbits a moving target
 * (the on-rails hero car) for the cinematic trailer.
 */
export function CameraRig({
  mode = "rails",
  path,
  lookAt = [0, 0, 0],
  target,
  speed = 0.04,
  cinematic,
  cinematicDrive,
}: CameraRigProps) {
  const { camera } = useThree();

  const curve = useMemo(() => {
    if (!path || path.length < 2) return null;
    const points = path.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    return new THREE.CatmullRomCurve3(points, true);
  }, [path]);

  const t = useRef(0);
  const scratch = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());
  const lookAtSmoothed = useRef(new THREE.Vector3());
  const lookReady = useRef(false);
  const quat = useRef(new THREE.Quaternion());

  useFrame((state, delta) => {
    if (mode === "cinematic" && cinematic) {
      const pose = cinematicCameraPose(state.clock.elapsedTime, cinematic);
      camera.position.set(pose.position[0], pose.position[1], pose.position[2]);
      camera.lookAt(pose.lookAt[0], pose.lookAt[1], pose.lookAt[2]);
    } else if (mode === "rails" && curve) {
      t.current = (t.current + delta * speed) % 1;
      curve.getPointAt(t.current, scratch.current);
      camera.position.copy(scratch.current);
      camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
    } else if (mode === "chase" && target?.current) {
      // Trail behind the target's heading (world-space; the target may be
      // nested inside a moving rigid body). Car forward is +z, so behind = -z.
      const pos = target.current.getWorldPosition(scratch.current);
      const heading = target.current.getWorldQuaternion(quat.current);
      desired.current.set(0, 3, -7.5).applyQuaternion(heading).add(pos);
      camera.position.lerp(desired.current, 1 - Math.pow(0.0025, delta));
      // Smooth the look target so per-step suspension jitter in the chassis
      // transform doesn't wobble the whole view (snap on the first frame to
      // avoid an initial swoop).
      if (!lookReady.current) {
        lookAtSmoothed.current.copy(pos);
        lookReady.current = true;
      } else {
        lookAtSmoothed.current.lerp(pos, 1 - Math.pow(0.02, delta));
      }
      camera.lookAt(lookAtSmoothed.current);
    } else if (mode === "cinematic-drive" && target?.current) {
      // Cinematic chase: trail the car (local -z = behind) but slowly sweep the
      // azimuth so the camera arcs around it as it drives — trailer energy, not
      // a dead-astern follow. Smoothed so the U-turn yaw never whips the view.
      const cfg = cinematicDrive ?? CINEMATIC_DRIVE_DEFAULTS;
      const pos = target.current.getWorldPosition(scratch.current);
      const heading = target.current.getWorldQuaternion(quat.current);
      const azim =
        Math.sin(state.clock.elapsedTime * cfg.sweepSpeed) * cfg.sweep;
      desired.current
        .set(
          Math.sin(azim) * cfg.distance,
          cfg.height,
          -Math.cos(azim) * cfg.distance,
        )
        .applyQuaternion(heading)
        .add(pos);
      camera.position.lerp(
        desired.current,
        1 - Math.pow(cfg.positionDamping, delta),
      );
      if (!lookReady.current) {
        lookAtSmoothed.current.copy(pos);
        lookReady.current = true;
      } else {
        lookAtSmoothed.current.lerp(pos, 1 - Math.pow(0.02, delta));
      }
      camera.lookAt(
        lookAtSmoothed.current.x,
        lookAtSmoothed.current.y + cfg.lookHeight,
        lookAtSmoothed.current.z,
      );
    }
  });

  return mode === "free" ? <OrbitControls makeDefault enableDamping /> : null;
}
