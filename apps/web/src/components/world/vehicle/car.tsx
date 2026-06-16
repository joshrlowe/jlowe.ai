"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three/webgpu";

const CAR_URL = "/models/car.glb";

/**
 * Real low-poly car BODY (CC0 "Cars" pack by Quaternius — see LICENSES.md),
 * loaded through R3F's loading manager so the pre-flight bar shows real
 * progress. The four wheels stay physics-driven (rendered separately by
 * Vehicle), so the GLB's own combined wheel meshes (`FrontWheels`/`BackWheels`)
 * are dropped here and only the shell (`Car_Dook`) ships.
 *
 * The source materials are flat low-poly greys; we re-skin the shell with a
 * glossy clearcoat paint (MeshPhysicalMaterial) so it reflects the HDRI, and
 * give the glazing a dark tinted-glass material. Everything is rebuilt from
 * `three/webgpu` classes — never the loader's bare-`three` materials — so the
 * WebGPU NodeBuilder never sees a foreign material instance.
 *
 * Scale/lift align the shell to the physics chassis (CHASSIS_HALF, wheel refs
 * in tuning.ts): the source shell is ~1.78 m wide, so a uniform scale near 1.0
 * lands it on the rig; the exact lift is eyeballed in a real browser.
 */

const PAINT_COLOR = "#e85d04"; // the chapter's signature ember orange
const SCALE = 1.06; // shell is ~1.78 m wide → ~1.8 m chassis width
const LIFT = -0.5; // drop the shell so the sills meet the wheels
const FORWARD = 0.1; // nudge the cabin back to centre over the wheelbase

/** Hidden combined-wheel nodes from the GLB (we drive 4 real wheels instead). */
const WHEEL_NODES = new Set(["FrontWheels", "BackWheels"]);

function paintMaterial(): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PAINT_COLOR),
    metalness: 0.6,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.1,
  });
  return m;
}

function glassMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#0a0d12"),
    metalness: 0.1,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.4,
  });
}

function trimMaterial(): THREE.MeshStandardMaterial {
  // Dark satin plastic/rubber for bumpers, grille, mirrors.
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color("#0d0b09"),
    metalness: 0.2,
    roughness: 0.6,
  });
}

/**
 * Map an original material name (from the CC0 source) to our re-skinned
 * `three/webgpu` material. `Main` is the paintable shell; `Windows` the glazing;
 * everything else is dark trim.
 */
function reskin(name: string): THREE.Material {
  if (name === "Main") return paintMaterial();
  if (name === "Windows") return glassMaterial();
  return trimMaterial();
}

export function CarBody() {
  const { scene } = useGLTF(CAR_URL);

  const body = useMemo(() => {
    const root = scene.clone(true);
    const cache = new Map<string, THREE.Material>();
    const skinFor = (name: string) => {
      let m = cache.get(name);
      if (!m) {
        m = reskin(name);
        cache.set(name, m);
      }
      return m;
    };

    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      if (WHEEL_NODES.has(obj.name)) {
        obj.visible = false;
        return;
      }
      obj.castShadow = true;
      obj.receiveShadow = true;
      const src = obj.material;
      obj.material = Array.isArray(src)
        ? src.map((mat) => skinFor((mat as THREE.Material).name))
        : skinFor((src as THREE.Material).name);
    });

    return root;
  }, [scene]);

  return (
    <group name="chassis" scale={SCALE} position={[0, LIFT, FORWARD]}>
      <primitive object={body} />
      {/* headlights — small emissive lenses at the nose corners */}
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} position={[x, 0.02, 1.78]}>
          <sphereGeometry args={[0.12, 16, 12]} />
          <meshStandardMaterial
            color="#fff6e0"
            emissive="#fff0cc"
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* tail lights */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.18, -1.92]}>
          <boxGeometry args={[0.26, 0.12, 0.06]} />
          <meshStandardMaterial
            color="#5a0a0a"
            emissive="#ff1f1f"
            emissiveIntensity={1.4}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

useGLTF.preload(CAR_URL);
