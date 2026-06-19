"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three/webgpu";

import type { CapabilityTier } from "@/lib/capabilities";
import { rendererInitForTier } from "@/lib/renderer";

import { PostFX } from "./core/post-fx";
import { qualityFor } from "./core/quality";
import { QualityProvider } from "./core/quality-provider";
import {
  resolveSceneKey,
  SceneManager,
  type SceneRegistry,
} from "./core/scene-manager";
import { PerfProbe } from "./debug/perf-probe";
import { InputBridge } from "./input-bridge";
import { CircuitScene } from "./scenes/circuit";
import { FixtureScene } from "./scenes/fixture";
import { HeroScene } from "./scenes/hero";
import { ProvingGroundScene } from "./scenes/proving-ground";
import { CHAPTERS } from "./state/chapters";

type WebGPURendererParams = ConstructorParameters<
  typeof THREE.WebGPURenderer
>[0];

// Scenes own their own camera (CameraRig). Every chapter scene's renderer lives
// here keyed by its sceneKey; the chapter scene set is sourced from CHAPTERS so
// registering a chapter wires its scene automatically.
const CHAPTER_SCENE_RENDERERS: SceneRegistry = {
  circuit: () => <CircuitScene />,
};
const chapterScenes: SceneRegistry = {};
for (const c of CHAPTERS) {
  const render = CHAPTER_SCENE_RENDERERS[c.sceneKey];
  if (!render) {
    throw new Error(`No scene renderer registered for chapter "${c.id}"`);
  }
  chapterScenes[c.sceneKey] = render;
}

// Chapter scenes from CHAPTERS, plus fixture/proving-ground/hero as extra
// non-chapter scenes reachable only via ?scene=.
const SCENES: SceneRegistry = {
  ...chapterScenes,
  fixture: () => <FixtureScene />,
  "proving-ground": () => <ProvingGroundScene />,
  hero: () => <HeroScene />,
};
// The first chapter's scene is the default (currently "circuit").
const DEFAULT_SCENE = CHAPTERS[0]?.sceneKey ?? "circuit";

/**
 * The R3F canvas, dynamically imported so three never enters a flat-route
 * bundle. Both tiers use three's WebGPURenderer; `webgl` forces its WebGL2
 * backend via the same code path (see lib/renderer). `await renderer.init()`
 * is required before the first frame (R3F awaits this gl promise).
 */
export function WorldCanvas({
  tier,
  isUltra,
  debug,
  activeScene,
}: {
  tier: Exclude<CapabilityTier, "2d">;
  isUltra: boolean;
  debug: boolean;
  activeScene: string;
}) {
  const forceWebGL = rendererInitForTier(tier)?.forceWebGL ?? false;
  const active = resolveSceneKey(activeScene, SCENES, DEFAULT_SCENE);
  const quality = qualityFor(tier, isUltra);

  return (
    <Canvas
      className="h-full w-full"
      dpr={[1, quality.maxDpr]}
      // Soft (PCFSoft) sun shadows. R3F owns shadowMap.enabled/type via this
      // prop (it overrides anything the gl factory sets), so enable it here.
      // Global enable is safe: only the hero scene opts in (its meshes
      // castShadow, its ground receiveShadow), so circuit / proving-ground
      // render identically.
      shadows="soft"
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
      <QualityProvider tier={tier} isUltra={isUltra}>
        <InputBridge />
        <SceneManager scenes={SCENES} active={active} />
        {/* Single TSL chain (ACES → bloom → vignette); drives the render loop. */}
        <PostFX />
        {debug ? <PerfProbe /> : null}
      </QualityProvider>
    </Canvas>
  );
}
