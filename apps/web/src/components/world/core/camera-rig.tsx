"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useMemo, useRef } from "react";
import * as THREE from "three/webgpu";

export type CameraMode = "rails" | "free" | "chase";

interface CameraRigProps {
  mode?: CameraMode;
  /** Control points for the `rails` spline. */
  path?: readonly [number, number, number][];
  /** Object to follow in `chase` mode. */
  target?: RefObject<THREE.Object3D | null>;
  speed?: number;
}

/**
 * Drives the active camera: `rails` follows a closed Catmull-Rom spline, `free`
 * hands control to OrbitControls, `chase` lerp-follows a target.
 */
export function CameraRig({
  mode = "rails",
  path,
  target,
  speed = 0.04,
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

  useFrame((_, delta) => {
    if (mode === "rails" && curve) {
      t.current = (t.current + delta * speed) % 1;
      curve.getPointAt(t.current, scratch.current);
      camera.position.copy(scratch.current);
      camera.lookAt(0, 0, 0);
    } else if (mode === "chase" && target?.current) {
      desired.current
        .copy(target.current.position)
        .add(scratch.current.set(0, 2.5, 6));
      camera.position.lerp(desired.current, 1 - Math.pow(0.0015, delta));
      camera.lookAt(target.current.position);
    }
  });

  return mode === "free" ? <OrbitControls makeDefault enableDamping /> : null;
}
