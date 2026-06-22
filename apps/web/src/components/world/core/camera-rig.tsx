"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useMemo, useRef } from "react";
import * as THREE from "three/webgpu";

import {
  cinematicCameraPose,
  type CinematicPathConfig,
} from "../scenes/hero/camera-path";

export type CameraMode = "rails" | "free" | "chase" | "cinematic";

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
}

/**
 * Drives the active camera: `rails` follows a closed Catmull-Rom spline, `free`
 * hands control to OrbitControls, `chase` lerp-follows a target.
 */
export function CameraRig({
  mode = "rails",
  path,
  lookAt = [0, 0, 0],
  target,
  speed = 0.04,
  cinematic,
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
    }
  });

  return mode === "free" ? <OrbitControls makeDefault enableDamping /> : null;
}
