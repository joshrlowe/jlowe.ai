"use client";

import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Object3D } from "three/webgpu";

import type { ThreeElements } from "@react-three/fiber";

// The curated hero GLBs are Draco-compressed; the decoder is self-hosted under
// /public/draco (no external CDN, so no runtime 404s). One shared loader.
let draco: DRACOLoader | null = null;
function dracoLoader(): DRACOLoader {
  draco ??= new DRACOLoader().setDecoderPath("/draco/");
  return draco;
}

function attachDraco(loader: GLTFLoader): void {
  loader.setDRACOLoader(dracoLoader());
}

/** Load a Draco GLB's scene graph through R3F's loading manager. */
export function useGltfScene(url: string): Object3D {
  const gltf = useLoader(GLTFLoader, url, attachDraco);
  return gltf.scene as unknown as Object3D;
}

type PrimitiveProps = Omit<ThreeElements["primitive"], "object">;

/**
 * A GLB rendered as a fresh clone, so the same model can be placed multiple
 * times (props) without the single cached scene being re-parented.
 */
export function HeroModel({ url, ...props }: { url: string } & PrimitiveProps) {
  const scene = useGltfScene(url);
  const object = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={object} {...props} />;
}
