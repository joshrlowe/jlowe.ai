"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three/webgpu";

import type { CapabilityTier } from "@/lib/capabilities";
import { rendererInitForTier } from "@/lib/renderer";

import { CameraRig } from "./core/camera-rig";
import { PostFX } from "./core/post-fx";
import { QualityProvider } from "./core/quality-provider";
import { SceneManager, type SceneRegistry } from "./core/scene-manager";
import { PerfProbe } from "./debug/perf-probe";
import { InputBridge } from "./input-bridge";
import { FixtureScene } from "./scenes/fixture";

type WebGPURendererParams = ConstructorParameters<
  typeof THREE.WebGPURenderer
>[0];

const SCENES: SceneRegistry = {
  fixture: () => <FixtureScene />,
};

/**
 * The R3F canvas, dynamically imported so three never enters a flat-route
 * bundle. Both tiers use three's WebGPURenderer; `webgl` forces its WebGL2
 * backend via the same code path (see lib/renderer). `await renderer.init()`
 * is required before the first frame (R3F awaits this gl promise).
 */
export function WorldCanvas({
  tier,
  debug,
}: {
  tier: Exclude<CapabilityTier, "2d">;
  debug: boolean;
}) {
  const forceWebGL = rendererInitForTier(tier)?.forceWebGL ?? false;

  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [6, 4, 8], fov: 50 }}
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
        <InputBridge />
        <SceneManager scenes={SCENES} active="fixture" />
        <CameraRig mode="free" />
        {/* Single TSL chain (ACES → bloom → vignette); drives the render loop. */}
        <PostFX />
        {debug ? <PerfProbe /> : null}
      </QualityProvider>
    </Canvas>
  );
}
