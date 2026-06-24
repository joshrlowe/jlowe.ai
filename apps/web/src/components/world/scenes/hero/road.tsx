"use client";

import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  cameraPosition,
  clamp,
  dot,
  mix,
  normalize,
  positionWorld,
  reflector,
  vec3,
} from "three/tsl";
import * as THREE from "three/webgpu";

import { useExplicitUltra, useQuality } from "../../core/quality-provider";

const ROAD_TEXTURES = [
  "/hero/road/asphalt_albedo.jpg",
  "/hero/road/asphalt_normal.jpg",
  "/hero/road/asphalt_roughness.jpg",
] as const;

const ROAD_WIDTH = 9;
const ROAD_LENGTH = 70;
const WET_LENGTH = 16;
const WET_CENTER_Z = 11;
const WET_Y = 0.02;

/**
 * The glossy "wet" zone as a true planar reflector (ultra + WebGPU + hero) so
 * the tarmac mirrors the car, sky, and props in real time — the rain-slicked
 * Forza look. Built on three's WEBGPU-NATIVE `reflector()` TSL node (a mirrored
 * render-target sampled in screen space), NOT drei's `MeshReflectorMaterial`,
 * which extends the classic `MeshStandardMaterial` + a `WebGLRenderTarget` and
 * so cannot compile on `WebGPURenderer`.
 *
 * The mirror is tinted toward wet asphalt and faded by a grazing-angle term
 * (reflections strengthen toward the horizon, like a real wet surface) so it
 * reads as a glossy puddle, not a chrome plate.
 */
function WetReflector() {
  const reflection = useMemo(() => {
    // bounces:false — a single reflection bounce; the wet zone never needs to
    // mirror other reflectors, and it caps the per-frame render cost.
    const node = reflector({ resolutionScale: 0.5, bounces: false });

    // Grazing-angle strength: ~0 looking straight down, →1 toward the horizon.
    const viewDir = normalize(positionWorld.sub(cameraPosition));
    const grazing = clamp(dot(viewDir, vec3(0, -1, 0)).oneMinus(), 0, 1);

    // Blend the mirrored scene toward a wet-asphalt tint; reflection peaks at
    // grazing angles, with a small floor so the puddle never goes fully matte.
    const wetTint = vec3(0.04, 0.045, 0.06);
    const colorNode = mix(wetTint, node, grazing.mul(0.85).add(0.1));

    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = colorNode;
    return { node, material };
  }, []);

  useEffect(() => () => reflection.material.dispose(), [reflection]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, WET_Y, WET_CENTER_Z]}
      material={reflection.material}
    >
      <planeGeometry args={[ROAD_WIDTH, WET_LENGTH]} />
      {/* The reflector's target plane must live under the reflective mesh. */}
      <primitive object={reflection.node.target} />
    </mesh>
  );
}

/** The glossy-but-static wet zone for the floor (webgl/2d, or non-ultra). */
function WetGlossy() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, WET_Y, WET_CENTER_Z]}
      receiveShadow
    >
      <planeGeometry args={[ROAD_WIDTH, WET_LENGTH]} />
      <meshStandardMaterial color="#0b0b0f" roughness={0.08} metalness={0.5} />
    </mesh>
  );
}

/**
 * A short asphalt road segment receding along +/-z, with a separate glossy
 * "wet" zone, sitting on a wide dark ground plane. PBR asphalt textures tile
 * along the road length. The wet zone upgrades to a live planar reflector on
 * the ultra WebGPU path; every lower tier keeps the byte-identical glossy mesh.
 */
export function HeroRoad() {
  const explicitUltra = useExplicitUltra();
  const { hdri } = useQuality();
  // `hdri` is the WebGPU-tier marker (HDRI IBL is WebGPU-only here). The planar
  // reflector renders the scene a second time, so it's gated on the explicit
  // `?quality=ultra` opt-in (not the strong-GPU auto-heuristic): the default
  // hero keeps the cheap static-glossy wet zone; explicit ultra upgrades it to
  // the live mirror. Keeps the auto-ultra first impression in budget.
  const reflectorActive = explicitUltra && hdri;

  const [rawAlbedo, rawNormal, rawRoughness] = useLoader(THREE.TextureLoader, [
    ...ROAD_TEXTURES,
  ]) as [THREE.Texture, THREE.Texture, THREE.Texture];

  // Clone before configuring — mutating a loader's cached texture is unsafe
  // (and disallowed); each clone owns its tiling/colour-space + disposal.
  const [albedo, normal, roughness] = useMemo(() => {
    const tile = (src: THREE.Texture, colorSpace: string): THREE.Texture => {
      const tex = src.clone();
      tex.colorSpace = colorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 14);
      tex.needsUpdate = true;
      return tex;
    };
    return [
      tile(rawAlbedo, THREE.SRGBColorSpace),
      tile(rawNormal, THREE.NoColorSpace),
      tile(rawRoughness, THREE.NoColorSpace),
    ];
  }, [rawAlbedo, rawNormal, rawRoughness]);

  useEffect(
    () => () => {
      albedo.dispose();
      normal.dispose();
      roughness.dispose();
    },
    [albedo, normal, roughness],
  );

  return (
    <>
      {/* ground plane — distinct, darker, surrounds the road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial
          color="#15110d"
          roughness={0.96}
          metalness={0.04}
        />
      </mesh>

      {/* asphalt road ribbon */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
        <meshStandardMaterial
          map={albedo}
          normalMap={normal}
          roughnessMap={roughness}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {reflectorActive ? <WetReflector /> : <WetGlossy />}
    </>
  );
}
