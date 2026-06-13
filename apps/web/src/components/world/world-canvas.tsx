"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three/webgpu";

import type { CapabilityTier } from "@/lib/capabilities";
import { rendererInitForTier } from "@/lib/renderer";

import { CameraRig } from "./core/camera-rig";
import { PostFX } from "./core/post-fx";
import { QualityProvider } from "./core/quality-provider";

type WebGPURendererParams = ConstructorParameters<
  typeof THREE.WebGPURenderer
>[0];

// A gentle closed orbit for the demo rails camera.
const DEMO_PATH: readonly [number, number, number][] = [
  [0, 0.5, 5],
  [4, 1, 2],
  [3, 0.5, -3],
  [-3, 1.5, -2],
  [-4, 0.5, 3],
];

function SpinningProbe() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.25;
      ref.current.rotation.y += delta * 0.6;
    }
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.2, 0]} />
      <meshStandardMaterial
        color="#e85d04"
        flatShading
        metalness={0.35}
        roughness={0.35}
      />
    </mesh>
  );
}

/**
 * The R3F canvas, dynamically imported so three never enters a flat-route
 * bundle. Both tiers use three's WebGPURenderer; `webgl` forces its WebGL2
 * backend via the same code path (see lib/renderer). `await renderer.init()`
 * is required before the first frame (R3F awaits this gl promise).
 */
export function WorldCanvas({ tier }: { tier: Exclude<CapabilityTier, "2d"> }) {
  const forceWebGL = rendererInitForTier(tier)?.forceWebGL ?? false;

  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [0, 0, 4.5], fov: 50 }}
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer({
          ...(props as WebGPURendererParams),
          forceWebGL,
          antialias: true,
        });
        await renderer.init();
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        return renderer;
      }}
    >
      <QualityProvider tier={tier}>
        <color attach="background" args={["#0a0705"]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 5]} intensity={2.5} />
        <SpinningProbe />
        <CameraRig mode="rails" path={DEMO_PATH} />
        {/* Single TSL chain (ACES → bloom → vignette); drives the render loop. */}
        <PostFX />
      </QualityProvider>
    </Canvas>
  );
}
