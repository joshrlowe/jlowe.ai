"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three/webgpu";

import type { CapabilityTier } from "@/lib/capabilities";
import { rendererInitForTier } from "@/lib/renderer";
import { useSceneParam } from "@/lib/use-scene-param";

import { PostFX } from "./core/post-fx";
import { QualityProvider } from "./core/quality-provider";
import { SceneManager, type SceneRegistry } from "./core/scene-manager";
import { PerfProbe } from "./debug/perf-probe";
import { InputBridge } from "./input-bridge";
import { CircuitScene } from "./scenes/circuit";
import { FixtureScene } from "./scenes/fixture";
import { ProvingGroundScene } from "./scenes/proving-ground";

type WebGPURendererParams = ConstructorParameters<
  typeof THREE.WebGPURenderer
>[0];

// Scenes own their own camera (CameraRig). The active scene comes from the
// chapter store later; for now ?scene= overrides, defaulting to the fixture.
const SCENES: SceneRegistry = {
  fixture: () => <FixtureScene />,
  "proving-ground": () => <ProvingGroundScene />,
  circuit: () => <CircuitScene />,
};
const DEFAULT_SCENE = "fixture"; // PR4 flips this to "circuit"

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
  const sceneParam = useSceneParam();
  const active =
    sceneParam && sceneParam in SCENES ? sceneParam : DEFAULT_SCENE;

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
        <SceneManager scenes={SCENES} active={active} />
        {/* Single TSL chain (ACES → bloom → vignette); drives the render loop. */}
        <PostFX />
        {debug ? <PerfProbe /> : null}
      </QualityProvider>
    </Canvas>
  );
}
